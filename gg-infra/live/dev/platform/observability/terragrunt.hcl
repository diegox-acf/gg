include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../../modules/observability"
}

dependency "eks" {
  config_path = "../eks-cluster"
  mock_outputs = {
    cluster_name           = "gg-gaming-dev"
    cluster_endpoint       = "https://mock.eks.amazonaws.com"
    cluster_ca_certificate = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  cluster_name           = dependency.eks.outputs.cluster_name
  cluster_endpoint       = dependency.eks.outputs.cluster_endpoint
  cluster_ca_certificate = dependency.eks.outputs.cluster_ca_certificate
  aws_region             = "us-east-1"

  # Set via environment variable — never hardcode passwords in version control
  grafana_admin_password = get_env("GRAFANA_ADMIN_PASSWORD", "")
  slack_webhook_url      = get_env("SLACK_WEBHOOK_URL", "")
}
