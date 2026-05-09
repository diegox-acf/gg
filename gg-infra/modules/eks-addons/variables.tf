variable "cluster_name" {
  type = string
}

variable "cluster_endpoint" {
  type = string
}

variable "cluster_ca_certificate" {
  description = "Base64-encoded CA certificate"
  type        = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_provider_url" {
  description = "OIDC provider URL without https://"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID — passed to AWS Load Balancer Controller"
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "argocd_admin_password_bcrypt" {
  description = "bcrypt hash of the initial ArgoCD admin password (generate with: htpasswd -nbBC 10 '' PASSWORD | tr -d ':\\n' | sed 's/$2y/$2a/')"
  type        = string
  sensitive   = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
