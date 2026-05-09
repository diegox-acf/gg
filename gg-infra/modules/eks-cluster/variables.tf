variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.30"
}

variable "vpc_id" {
  description = "VPC ID to deploy the cluster into"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for EKS nodes and control plane ENIs"
  type        = list(string)
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed node group (arm64)"
  type        = list(string)
  default     = ["t4g.medium"]
}

variable "node_capacity_type" {
  description = "SPOT or ON_DEMAND"
  type        = string
  default     = "SPOT"
}

variable "node_ami_type" {
  description = "AMI type for nodes — AL2_ARM_64 for Graviton"
  type        = string
  default     = "AL2_ARM_64"
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_desired_size" {
  type    = number
  default = 3
}

variable "node_max_size" {
  type    = number
  default = 5
}

variable "node_disk_size_gb" {
  description = "Root EBS volume size in GB per node"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags applied to all resources"
  type        = map(string)
  default     = {}
}
