# Root terragrunt.hcl
# Every unit in live/ does `include "root" { path = find_in_parent_folders() }`
# to inherit remote state config, provider codegen, and version pins.

locals {
  # Read account-level locals (region, account_id, environment, project)
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl", "account.hcl"))
  region       = local.account_vars.locals.aws_region
  account_id   = local.account_vars.locals.aws_account_id
  env          = local.account_vars.locals.environment
  project      = local.account_vars.locals.project
}

# ── Remote state (S3 + DynamoDB) ──────────────────────────────────────────────
# State key mirrors the filesystem path so it's trivially inspectable:
#   live/dev/foundation/vpc/terraform.tfstate
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "${local.project}-tfstate-${local.account_id}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.region
    encrypt        = true
    dynamodb_table = "${local.project}-tfstate-lock"
  }
}

# ── AWS provider (generated into every unit) ───────────────────────────────────
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<-EOF
    provider "aws" {
      region = "${local.region}"
      default_tags {
        tags = {
          Project     = "${local.project}"
          Environment = "${local.env}"
          ManagedBy   = "terragrunt"
          Repository  = "gg-infra"
        }
      }
    }
  EOF
}

# ── Terraform + provider version pins (generated into every unit) ─────────────
generate "versions" {
  path      = "versions.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<-EOF
    terraform {
      required_version = ">= 1.9, < 2.0"
      required_providers {
        aws = {
          source  = "hashicorp/aws"
          version = "~> 5.60"
        }
        helm = {
          source  = "hashicorp/helm"
          version = "~> 2.14"
        }
        kubernetes = {
          source  = "hashicorp/kubernetes"
          version = "~> 2.31"
        }
        tls = {
          source  = "hashicorp/tls"
          version = "~> 4.0"
        }
      }
    }
  EOF
}
