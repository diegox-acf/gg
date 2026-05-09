output "role_arn" {
  description = "ARN of the GitHub Actions IAM role — use as role-to-assume in workflows"
  value       = aws_iam_role.github_actions.arn
}

output "role_name" {
  value = aws_iam_role.github_actions.name
}
