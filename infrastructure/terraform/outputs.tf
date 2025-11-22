output "vpc_id" {
  description = "ID of the created VPC"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnets
}

output "ec2_instance_1_id" {
  description = "ID of the first EC2 instance"
  value       = module.ec2_instance_1.instance_id
}

output "ec2_instance_1_public_ip" {
  description = "Public Elastic IP of the EC2 instance"
  value       = aws_eip.lb.public_ip
}

output "private_key_pem" {
  description = "Private key in PEM format"
  value       = tls_private_key.ssh_key.private_key_pem
  sensitive   = true
}
