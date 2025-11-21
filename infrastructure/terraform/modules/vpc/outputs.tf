output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs (alternative output)"
  value       = aws_subnet.public[*].id
}
