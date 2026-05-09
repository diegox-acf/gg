include "root" {
  path = find_in_parent_folders()
}

locals {
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  env          = local.account_vars.locals.environment
  project      = local.account_vars.locals.project
}

terraform {
  source = "../../../../modules/iam-github-oidc"
}

inputs = {
  cluster_name = "${local.project}-${local.env}"
  github_org   = "diegox-acf"
  aws_region   = "us-east-1"
}
