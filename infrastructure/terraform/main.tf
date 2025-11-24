# Tags comunes para todos los recursos
locals {
  base_name = "${var.company}-${var.project}-${var.environment}"

  common_tags = {
    Project     = "cecre-portal"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ----------------------------------
# Infraestructura de red
# ----------------------------------

module "vpc" {
  source      = "./modules/vpc"
  vpc_cidr    = var.vpc_cidr
  azs         = var.azs
  environment = var.environment
  tags        = local.common_tags
}

# ----------------------------------
# SSH Key Pair
# ----------------------------------

resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "deployer" {
  key_name   = "${var.environment}-deployer-key"
  public_key = tls_private_key.ssh_key.public_key_openssh
}

# ----------------------------------
# S3 Bucket for K8s Storage and Logs
# ----------------------------------

module "s3_bucket" {
  source      = "./modules/s3-bucket"
  bucket_name = "cecre-k8"
  tags = merge(
    local.common_tags,
    {
      Name    = "cecre-k8"
      Purpose = "K8s data backup and monitoring logs"
    }
  )
}

# ----------------------------------
# IAM Role for EC2 Instance
# ----------------------------------

module "iam_role" {
  source     = "./modules/iam-role"
  role_name  = "${local.base_name}-ec2-role"
  bucket_arn = module.s3_bucket.bucket_arn
  tags       = local.common_tags
}

# ----------------------------------
# EC2 Instances
# ----------------------------------

module "ec2_instance_1" {
  source               = "./modules/ec2-instance"
  ami                  = var.ec2_ami
  instance_type        = var.ec2_type
  environment          = "${var.environment}-1"
  tags                 = local.common_tags
  subnet_id            = module.vpc.public_subnets[0]
  vpc_id               = module.vpc.vpc_id
  key_name             = aws_key_pair.deployer.key_name
  volume_size          = 8
  iam_instance_profile = module.iam_role.instance_profile_name
  availability_zone    = var.azs[0]
}

# ----------------------------------
# Persistent EBS Volume for K8s Data
# ----------------------------------

module "ebs_volume" {
  source            = "./modules/ebs-volume"
  availability_zone = var.azs[0]
  size              = 64
  type              = "gp3"
  encrypted         = true
  device_name       = "/dev/sdf"
  instance_id       = module.ec2_instance_1.instance_id
  force_detach      = false

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.base_name}-k8s-data"
      Purpose = "Persistent storage for MicroK8s"
    }
  )
}

# ----------------------------------
# Elastic IP
# ----------------------------------

resource "aws_eip" "lb" {
  instance = module.ec2_instance_1.instance_id
  domain   = "vpc"
  tags     = local.common_tags
}
