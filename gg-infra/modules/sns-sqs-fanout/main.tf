resource "aws_sns_topic" "this" {
  name = var.topic_name
  tags = merge(var.tags, { Name = var.topic_name })
}

resource "aws_sqs_queue" "dlq" {
  for_each = { for q in var.queues : q.name => q }

  name                      = "${each.key}-dlq"
  message_retention_seconds = var.message_retention_seconds * 4   # DLQ retains longer
  tags                      = merge(var.tags, { Name = "${each.key}-dlq" })
}

resource "aws_sqs_queue" "this" {
  for_each = { for q in var.queues : q.name => q }

  name                       = each.key
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = each.value.max_receive_count
  })

  tags = merge(var.tags, { Name = each.key })
}

resource "aws_sqs_queue_policy" "this" {
  for_each  = { for q in var.queues : q.name => q }
  queue_url = aws_sqs_queue.this[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "sns.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.this[each.key].arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_sns_topic.this.arn }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "this" {
  for_each  = { for q in var.queues : q.name => q }
  topic_arn = aws_sns_topic.this.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.this[each.key].arn
}
