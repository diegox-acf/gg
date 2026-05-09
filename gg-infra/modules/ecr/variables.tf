variable "repository_names" {
  description = "List of ECR repository names to create"
  type        = list(string)
}

variable "lifecycle_policy_count" {
  description = "Keep at most this many images per repository"
  type        = number
  default     = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}
