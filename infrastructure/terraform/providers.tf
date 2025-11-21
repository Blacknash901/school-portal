provider "aws" {
  region     = var.region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

provider "tls" {
  # No se requieren configuraciones específicas
}

provider "local" {
  # No se requieren configuraciones específicas
}