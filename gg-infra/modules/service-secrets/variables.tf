variable "secret_name" {
  description = "Full path name for the secret (e.g. /gg-gaming/dev/catalog/db)"
  type        = string
}

variable "description" {
  type    = string
  default = ""
}

variable "secret_value_json" {
  description = "JSON string containing the secret key-value pairs"
  type        = string
  sensitive   = true
}

variable "recovery_window_days" {
  description = "Days before the secret can be permanently deleted (0 = immediate, dev only)"
  type        = number
  default     = 0
}

variable "tags" {
  type    = map(string)
  default = {}
}
