include "root" {
  path = find_in_parent_folders()
}

locals {
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  env          = local.account_vars.locals.environment
  project      = local.account_vars.locals.project
}

terraform {
  source = "../../../../modules/eks-addons"
}

dependency "vpc" {
  config_path = "../../foundation/vpc"
  mock_outputs = {
    vpc_id = "vpc-00000000000000000"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "eks" {
  config_path = "../eks-cluster"
  mock_outputs = {
    cluster_name           = "gg-gaming-dev"
    cluster_endpoint       = "https://mock.eks.amazonaws.com"
    cluster_ca_certificate = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t"
    oidc_provider_arn      = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/MOCK"
    oidc_provider_url      = "oidc.eks.us-east-1.amazonaws.com/id/MOCK"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  cluster_name           = dependency.eks.outputs.cluster_name
  cluster_endpoint       = dependency.eks.outputs.cluster_endpoint
  cluster_ca_certificate = dependency.eks.outputs.cluster_ca_certificate
  oidc_provider_arn      = dependency.eks.outputs.oidc_provider_arn
  oidc_provider_url      = dependency.eks.outputs.oidc_provider_url
  vpc_id                 = dependency.vpc.outputs.vpc_id
  aws_region             = "us-east-1"

  # Generate with: htpasswd -nbBC 10 '' PASSWORD | tr -d ':\n' | sed 's/$2y/$2a/'
  # Store the plaintext password in AWS Secrets Manager, not here
  argocd_admin_password_bcrypt = get_env("ARGOCD_ADMIN_PASSWORD_BCRYPT", "")
}
