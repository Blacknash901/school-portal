variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "company" {
  description = "Company name for tagging"
  type        = string
  default     = "cecre"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "school-portal"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "Dev"
}

variable "vpc_cidr" {
  description = "CIDR for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "ec2_ami" {
  description = "AMI ID for EC2"
  type        = string
  default     = "ami-06e880a88a1e3ebd9"
}

variable "ec2_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.medium"
}

variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}


