output "topic_arn" {
  value = aws_sns_topic.this.arn
}

output "queue_arns" {
  description = "Map of queue name → ARN"
  value       = { for name, q in aws_sqs_queue.this : name => q.arn }
}

output "queue_urls" {
  description = "Map of queue name → URL"
  value       = { for name, q in aws_sqs_queue.this : name => q.id }
}

output "dlq_arns" {
  description = "Map of DLQ name → ARN"
  value       = { for name, q in aws_sqs_queue.dlq : name => q.arn }
}
