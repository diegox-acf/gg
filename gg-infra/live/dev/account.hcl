locals {
  aws_region     = "us-east-1"
  aws_account_id = "FILL_IN"   # replace with: aws sts get-caller-identity --query Account --output text
  environment    = "dev"
  project        = "gg-gaming"
}
