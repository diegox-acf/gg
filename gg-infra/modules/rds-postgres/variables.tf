variable "identifier" {
  description = "Unique identifier for the RDS instance (e.g. gg-catalog-dev)"
  type        = string
}

variable "db_name" {
  type = string
}

variable "username" {
  type = string
}

variable "engine_version" {
  type    = string
  default = "16.3"
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "allocated_storage_gb" {
  type    = number
  default = 20
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to connect on port 5432 (e.g. EKS node SG)"
  type        = list(string)
}

variable "multi_az" {
  type    = bool
  default = false   # set to true for prod
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  type    = bool
  default = false   # keep false in dev to allow terragrunt destroy
}

variable "skip_final_snapshot" {
  type    = bool
  default = true    # dev only
}

variable "tags" {
  type    = map(string)
  default = {}
}
