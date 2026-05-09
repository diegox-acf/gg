variable "role_name" {
  description = "Name for the IAM role"
  type        = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_provider_url" {
  description = "OIDC provider URL without https://"
  type        = string
}

variable "k8s_namespace" {
  description = "Kubernetes namespace of the service account"
  type        = string
}

variable "k8s_service_account_name" {
  description = "Kubernetes service account name"
  type        = string
}

variable "policy_arns" {
  description = "List of managed IAM policy ARNs to attach"
  type        = list(string)
  default     = []
}

variable "inline_policy_json" {
  description = "Optional inline policy document (JSON string)"
  type        = string
  default     = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
