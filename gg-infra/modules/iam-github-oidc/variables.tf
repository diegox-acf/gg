variable "cluster_name" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "github_org" {
  description = "GitHub org or username that owns the gg-* repos"
  type        = string
  default     = "diegox-acf"
}

variable "tags" {
  type    = map(string)
  default = {}
}
