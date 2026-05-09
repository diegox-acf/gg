#!/usr/bin/env bash
# bootstrap-state.sh
# One-time script to create the S3 bucket and DynamoDB table that Terragrunt
# uses for remote state. Must be run BEFORE any `terragrunt` commands.
#
# Usage:
#   chmod +x scripts/bootstrap-state.sh
#   AWS_PROFILE=gg-gaming ./scripts/bootstrap-state.sh
set -euo pipefail

REGION="us-east-1"
PROJECT="gg-gaming"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="${PROJECT}-tfstate-${ACCOUNT_ID}"
TABLE="${PROJECT}-tfstate-lock"

echo "Account: ${ACCOUNT_ID}"
echo "Creating state bucket: s3://${BUCKET}"

# Create bucket
aws s3api create-bucket \
  --bucket "${BUCKET}" \
  --region "${REGION}"

# Enable versioning (required — Terragrunt uses it)
aws s3api put-bucket-versioning \
  --bucket "${BUCKET}" \
  --versioning-configuration Status=Enabled

# Enable SSE with AWS-managed key
aws s3api put-bucket-encryption \
  --bucket "${BUCKET}" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"},"BucketKeyEnabled":true}]}'

# Block all public access
aws s3api put-public-access-block \
  --bucket "${BUCKET}" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Creating DynamoDB lock table: ${TABLE}"

aws dynamodb create-table \
  --table-name "${TABLE}" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "${REGION}" \
  --output text > /dev/null

echo ""
echo "Bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. Fill in account_id in live/dev/account.hcl: ${ACCOUNT_ID}"
echo "  2. cd live/dev/foundation && terragrunt run-all apply"
echo "  3. cd live/dev/platform   && terragrunt run-all apply"
