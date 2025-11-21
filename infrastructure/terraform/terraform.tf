terraform {
  required_version = ">= 1.8.0"

  # Terraform Cloud Backend Configuration
  # 1. Create an account on https://app.terraform.io
  # 2. Create an Organization and a Workspace (e.g., "school-portal-prod")
  # 3. Replace "your-org-name" with your actual organization name below.
  cloud {
    organization = "cecre-org"

    workspaces {
      name = "school-portal-prod"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}