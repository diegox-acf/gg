output "repository_urls" {
  description = "Map of repository name → full ECR URL"
  value       = { for name, repo in aws_ecr_repository.this : name => repo.repository_url }
}

output "registry_id" {
  description = "AWS account ID (same as ECR registry ID)"
  value       = values(aws_ecr_repository.this)[0].registry_id
}
