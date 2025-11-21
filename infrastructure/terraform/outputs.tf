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

output "ec2_instance_2_id" {
  description = "ID of the second EC2 instance"
  value       = module.ec2_instance_2.instance_id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = module.load_balancer.dns_name
}

output "ec2_instance_1_public_ip" {
  description = "Public IP of the first EC2 instance"
  value       = module.ec2_instance_1.public_ip
}

output "ec2_instance_2_public_ip" {
  description = "Public IP of the second EC2 instance"
  value       = module.ec2_instance_2.public_ip
}

output "private_key_pem" {
  description = "Private key in PEM format"
  value       = tls_private_key.ssh_key.private_key_pem
  sensitive   = true
}
