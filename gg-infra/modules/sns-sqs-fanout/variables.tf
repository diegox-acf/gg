variable "topic_name" {
  description = "Name for the SNS topic (e.g. gg-order-events-dev)"
  type        = string
}

variable "queues" {
  description = "Consumer queues to create and subscribe to the topic"
  type = list(object({
    name              = string
    max_receive_count = optional(number, 3)
  }))
}

variable "visibility_timeout_seconds" {
  type    = number
  default = 30
}

variable "message_retention_seconds" {
  type    = number
  default = 86400   # 1 day (dev); 345600 = 4 days for prod
}

variable "tags" {
  type    = map(string)
  default = {}
}
