include "root" {
  path = find_in_parent_folders()
}

locals {
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  env          = local.account_vars.locals.environment
  project      = local.account_vars.locals.project
}

terraform {
  source = "../../../../modules/eks-cluster"
}

dependency "vpc" {
  config_path = "../../foundation/vpc"
  mock_outputs = {
    vpc_id             = "vpc-00000000000000000"
    private_subnet_ids = ["subnet-00000000000000000", "subnet-00000000000000001"]
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  cluster_name   = "${local.project}-${local.env}"
  cluster_version = "1.30"
  vpc_id          = dependency.vpc.outputs.vpc_id
  subnet_ids      = dependency.vpc.outputs.private_subnet_ids

  # Graviton spot nodes — cost-optimised for dev
  node_instance_types = ["t4g.medium"]
  node_capacity_type  = "SPOT"
  node_ami_type       = "AL2_ARM_64"
  node_min_size       = 2
  node_desired_size   = 3
  node_max_size       = 5
  node_disk_size_gb   = 30
}
