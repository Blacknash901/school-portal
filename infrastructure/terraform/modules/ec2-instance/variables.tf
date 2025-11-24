variable "ami" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the EC2 instance"
  type        = map(string)
}

variable "vpc_id" {
  description = "VPC ID for the security group"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID where the EC2 instance will be launched"
  type        = string
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
}

variable "volume_size" {
  description = "Size of the root volume in GB"
  type        = number
  default     = 20
}

variable "iam_instance_profile" {
  description = "IAM instance profile name for EC2 instance"
  type        = string
  default     = ""
}

variable "availability_zone" {
  description = "Availability zone for the EC2 instance"
  type        = string
  default     = ""
}