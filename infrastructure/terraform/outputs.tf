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

output "ebs_volume_id" {
  description = "ID of the persistent EBS volume for K8s data"
  value       = module.ebs_volume.volume_id
}

output "ebs_volume_size" {
  description = "Size of the persistent EBS volume in GB"
  value       = module.ebs_volume.volume_size
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for K8s backups and logs"
  value       = module.s3_bucket.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.s3_bucket.bucket_arn
}

output "iam_role_arn" {
  description = "ARN of the IAM role attached to EC2 instance"
  value       = module.iam_role.role_arn
}
