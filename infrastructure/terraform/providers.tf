provider "aws" {
  region = var.region
}

provider "tls" {
  # No se requieren configuraciones específicas
}

provider "local" {
  # No se requieren configuraciones específicas
}