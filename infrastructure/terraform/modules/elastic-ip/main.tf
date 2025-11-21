resource "aws_eip" "elastic_ip" {
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-elastic-ip"
    }
  )
}

output "allocation_id" {
  description = "Allocation ID of the Elastic IP"
  value       = aws_eip.elastic_ip.id
}

output "public_ip" {
  description = "Elastic IP address"
  value       = aws_eip.elastic_ip.public_ip
}