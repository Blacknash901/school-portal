variable "role_name" {
  description = "Name of the IAM role"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket to grant access to"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
