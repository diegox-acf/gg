provider "helm" {
  kubernetes {
    host                   = var.cluster_endpoint
    cluster_ca_certificate = base64decode(var.cluster_ca_certificate)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", var.cluster_name, "--region", var.aws_region]
    }
  }
}

# ── kube-prometheus-stack (Prometheus + Grafana + Alertmanager) ────────────────

resource "helm_release" "prometheus_stack" {
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  version          = "65.1.1"
  namespace        = "monitoring"
  create_namespace = true
  timeout          = 600

  values = [
    yamlencode({
      grafana = {
        adminPassword = var.grafana_admin_password
        ingress = {
          enabled          = true
          ingressClassName = "alb"
          annotations = {
            "alb.ingress.kubernetes.io/scheme"       = "internet-facing"
            "alb.ingress.kubernetes.io/target-type"  = "ip"
            "alb.ingress.kubernetes.io/listen-ports" = "[{\"HTTPS\":443}]"
          }
          hosts = ["grafana.dev.gaming.gg"]
          tls   = [{ hosts = ["grafana.dev.gaming.gg"] }]
        }
        additionalDataSources = [
          {
            name   = "Tempo"
            type   = "tempo"
            url    = "http://tempo.monitoring:3100"
            access = "proxy"
          },
          {
            name   = "Loki"
            type   = "loki"
            url    = "http://loki.monitoring:3100"
            access = "proxy"
          },
        ]
      }
      alertmanager = {
        config = var.slack_webhook_url != "" ? {
          global = {
            slack_api_url = var.slack_webhook_url
          }
          route = {
            receiver = "slack-notifications"
            routes = [{
              match    = { severity = "critical" }
              receiver = "slack-notifications"
            }]
          }
          receivers = [{
            name = "slack-notifications"
            slack_configs = [{
              channel  = "#gg-alerts"
              title    = "{{ .GroupLabels.alertname }}"
              text     = "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
            }]
          }]
        } : {}
      }
      prometheus = {
        prometheusSpec = {
          retention          = "7d"
          storageSpec = {
            volumeClaimTemplate = {
              spec = {
                storageClassName = "gp2"
                accessModes      = ["ReadWriteOnce"]
                resources        = { requests = { storage = "20Gi" } }
              }
            }
          }
        }
      }
    })
  ]
}

# ── Loki (single-binary, dev mode) ────────────────────────────────────────────

resource "helm_release" "loki" {
  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki"
  version          = "6.18.0"
  namespace        = "monitoring"
  create_namespace = true
  timeout          = 300

  values = [
    yamlencode({
      deploymentMode = "SingleBinary"
      loki = {
        commonConfig = { replication_factor = 1 }
        storage      = { type = "filesystem" }
        schemaConfig = {
          configs = [{
            from         = "2024-01-01"
            store        = "tsdb"
            object_store = "filesystem"
            schema       = "v13"
            index        = { prefix = "index_", period = "24h" }
          }]
        }
      }
      singleBinary = {
        replicas = 1
        persistence = {
          enabled      = true
          size         = "10Gi"
          storageClass = "gp2"
        }
      }
      # Promtail installed separately
      gateway = { enabled = false }
    })
  ]
}

# ── Promtail (log shipper DaemonSet → Loki) ────────────────────────────────────

resource "helm_release" "promtail" {
  name       = "promtail"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "promtail"
  version    = "6.16.6"
  namespace  = "monitoring"
  timeout    = 120

  values = [
    yamlencode({
      config = {
        clients = [{ url = "http://loki.monitoring:3100/loki/api/v1/push" }]
      }
    })
  ]

  depends_on = [helm_release.loki]
}

# ── Tempo (single-binary, dev mode) ───────────────────────────────────────────

resource "helm_release" "tempo" {
  name             = "tempo"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "tempo"
  version          = "1.10.3"
  namespace        = "monitoring"
  create_namespace = true
  timeout          = 180

  values = [
    yamlencode({
      tempo = {
        storage = {
          trace = {
            backend = "local"
            local   = { path = "/var/tempo/traces" }
          }
        }
      }
      persistence = {
        enabled      = true
        size         = "10Gi"
        storageClass = "gp2"
      }
    })
  ]
}

# ── OpenTelemetry Collector (DaemonSet) ────────────────────────────────────────

resource "helm_release" "otel_collector" {
  name             = "opentelemetry-collector"
  repository       = "https://open-telemetry.github.io/opentelemetry-helm-charts"
  chart            = "opentelemetry-collector"
  version          = "0.108.0"
  namespace        = "monitoring"
  create_namespace = true
  timeout          = 180

  values = [
    yamlencode({
      mode = "daemonset"
      config = {
        receivers = {
          otlp = {
            protocols = {
              grpc = { endpoint = "0.0.0.0:4317" }
              http = { endpoint = "0.0.0.0:4318" }
            }
          }
        }
        processors = {
          batch        = {}
          memory_limiter = {
            check_interval         = "1s"
            limit_percentage       = 75
            spike_limit_percentage = 15
          }
        }
        exporters = {
          otlp = {
            endpoint = "tempo.monitoring:4317"
            tls      = { insecure = true }
          }
          prometheusremotewrite = {
            endpoint = "http://kube-prometheus-stack-prometheus.monitoring:9090/api/v1/write"
          }
        }
        service = {
          pipelines = {
            traces  = { receivers = ["otlp"], processors = ["memory_limiter", "batch"], exporters = ["otlp"] }
            metrics = { receivers = ["otlp"], processors = ["memory_limiter", "batch"], exporters = ["prometheusremotewrite"] }
          }
        }
      }
    })
  ]

  depends_on = [helm_release.tempo, helm_release.prometheus_stack]
}
