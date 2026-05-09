include "root" {
  path = find_in_parent_folders()
}

locals {
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  env          = local.account_vars.locals.environment
  project      = local.account_vars.locals.project
  cluster_name = "${local.project}-${local.env}"
}

terraform {
  source = "../../../../modules/vpc"
}

inputs = {
  name         = local.cluster_name
  cluster_name = local.cluster_name
  vpc_cidr             = "10.0.0.0/16"
  azs                  = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
}
