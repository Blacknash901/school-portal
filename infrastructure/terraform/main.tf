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
# EC2 Instances
# ----------------------------------

module "ec2_instance_1" {
  source        = "./modules/ec2-instance"
  ami           = var.ec2_ami
  instance_type = var.ec2_type
  environment   = "${var.environment}-1"
  tags          = local.common_tags
  subnet_id     = module.vpc.public_subnets[0]
  vpc_id        = module.vpc.vpc_id
  key_name      = aws_key_pair.deployer.key_name
}

# ----------------------------------
# Load Balancer
# ----------------------------------

module "load_balancer" {
  source              = "./modules/load-balancer"
  project             = var.project
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  subnets             = module.vpc.public_subnets
  security_groups     = [module.ec2_instance_1.security_group_id]
  target_instance_ids = [module.ec2_instance_1.instance_id]
  tags                = local.common_tags
}
