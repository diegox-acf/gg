output "secret_arn" {
  description = "ARN of the secret — reference in IRSA policies and ESO SecretStore"
  value       = aws_secretsmanager_secret.this.arn
}

output "secret_name" {
  value = aws_secretsmanager_secret.this.name
}
