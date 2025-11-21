variable "tags" {
  description = "Tags to apply to the Elastic IP"
  type        = map(string)
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}