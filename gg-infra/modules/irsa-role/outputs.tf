output "role_arn" {
  description = "ARN to set as eks.amazonaws.com/role-arn annotation on the ServiceAccount"
  value       = aws_iam_role.this.arn
}

output "role_name" {
  value = aws_iam_role.this.name
}
