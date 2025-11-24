# Infrastructure as Code (Terraform)

[![Terraform Deploy](https://github.com/Blacknash901/school-portal/actions/workflows/terraform-deploy.yml/badge.svg)](https://github.com/Blacknash901/school-portal/actions/workflows/terraform-deploy.yml)
[![Terraform Destroy](https://github.com/Blacknash901/school-portal/actions/workflows/terraform-destroy.yml/badge.svg)](https://github.com/Blacknash901/school-portal/actions/workflows/terraform-destroy.yml)

This package builds all AWS infrastructure that the School Portal platform needs before the Ansible playbooks take over (VPC, EC2 host, IAM role, EBS data disk, S3 backups, Elastic IP, etc.). Everything is composed out of reusable modules under `modules/`, and the root module only wires them together plus a few helper resources (TLS key pair and Elastic IP).

> **State backend:** The `terraform.tf` file is already configured to use **Terraform Cloud (HCP)**. You must create an organization + workspace there and keep the `cloud {}` block in sync. Local state files are ignored; all CI workflows expect the remote backend.

---

## Module Breakdown

| Module         | Path                   | Responsibility                                                                                                                |
| -------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `vpc`          | `modules/vpc`          | VPC, public subnets (per AZ), IGW, route table, and associations.                                                             |
| `s3-bucket`    | `modules/s3-bucket`    | Versioned + encrypted S3 bucket with lifecycle rules for backups/logs.                                                        |
| `iam-role`     | `modules/iam-role`     | EC2 role + inline policy (S3 backups + CloudWatch metrics) + instance profile.                                                |
| `ec2-instance` | `modules/ec2-instance` | Security group + single ARM EC2 host that runs MicroK8s.                                                                      |
| `ebs-volume`   | `modules/ebs-volume`   | 64 GB gp3 data disk attached to the EC2 host (MicroK8s storage).                                                              |
| `elastic-ip`   | (inline resource)      | Dedicated EIP bound to the EC2 host for stable DNS.                                                                           |
| `ansible.tf`   | (inline helper)        | Writes `deployment/ansible/inventory.generated.yml` and `private_key.pem` from Terraform outputs for the playbooks/workflows. |

All resources are therefore modularized; root `main.tf` simply instantiates each module with shared tags and connects their outputs.

---

## Required Inputs / Variables

| Variable                            | Description                           | Default                         |
| ----------------------------------- | ------------------------------------- | ------------------------------- |
| `region`                            | AWS region for all resources.         | `us-east-1`                     |
| `company`, `project`, `environment` | Tag helpers used for naming.          | `cecre`, `school-portal`, `Dev` |
| `vpc_cidr`                          | CIDR block for the VPC.               | `10.0.0.0/16`                   |
| `azs`                               | List of availability zones to span.   | `["us-east-1a", "us-east-1b"]`  |
| `ec2_ami`                           | AMI ID (ARM Ubuntu 22.04).            | `ami-06e880a88a1e3ebd9`         |
| `ec2_type`                          | Instance size.                        | `t4g.medium`                    |
| `aws_access_key`, `aws_secret_key`  | Credentials used by the AWS provider. | _none_                          |

Create a `terraform.tfvars` (already gitignored) or export the matching `TF_VAR_*` environment variables before running Terraform manually.

Example `terraform.tfvars`:

```hcl
region       = "us-east-1"
company      = "cecre"
project      = "school-portal"
environment  = "Prod"
vpc_cidr     = "10.0.0.0/16"
azs          = ["us-east-1a", "us-east-1b"]
ec2_ami      = "ami-06e880a88a1e3ebd9"
ec2_type     = "t4g.medium"
aws_access_key = "AKIA..."
aws_secret_key = "..."
```

---

## Local Workflow

```bash
cd infrastructure/terraform
terraform login                     # once, to generate credentials.tfrc
terraform init                      # uses Terraform Cloud backend
terraform plan -out=tfplan
terraform apply tfplan
```

Terraform will emit:

- EIP / instance IDs
- PEM-encoded SSH private key (`outputs.private_key_pem`)
- EBS volume ID
- S3 bucket identifiers

The helper in `ansible.tf` converts those outputs into `deployment/ansible/private_key.pem` and `deployment/ansible/inventory.generated.yml`, so Ansible (or the GitHub deploy workflow) can immediately provision MicroK8s.

Destroying locally:

```bash
terraform destroy
```

Because the backend lives in Terraform Cloud, you must pass a valid `TF_API_TOKEN` (either via `terraform login` locally or the GitHub secret).

---

## GitHub Workflow Integration

- **`.github/workflows/terraform-deploy.yml`** runs the exact steps above on `ubuntu-latest` and requires the following secrets:
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - `TF_API_TOKEN`
  - Optional: `PRODUCTION_DOMAIN`, `USE_IP`, `USE_HTTPS`, `LETSENCRYPT_EMAIL`, `K8S_NAMESPACE` (forwarded into the generated inventory and later Ansible runs)
- After `terraform apply`, that workflow copies the rendered inventory/private key and immediately calls `deployment/ansible/deploy-all.yml` to finish configuring the host.
- **`.github/workflows/terraform-destroy.yml`** reuses the same backend + secrets and simply runs `terraform destroy` from this directory.

Make sure Terraform Cloud workspace (`cecre-org/school-portal-prod` by default) is accessible to both workflows; otherwise `terraform init` will fail.

---

## Outputs Summary

| Output                              | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `ec2_instance_1_public_ip`          | Used by DNS, Ansible inventory, and GitHub workflows.              |
| `private_key_pem` (sensitive)       | SSH key handed to Ansible for provisioning.                        |
| `ebs_volume_id` / `ebs_volume_size` | Used by playbooks to mount the persistent disk.                    |
| `s3_bucket_name` / `s3_bucket_arn`  | Referenced by IAM policy and backup scripts.                       |
| `iam_role_arn`                      | Audit/debugging (ensures correct role attached).                   |
| `vpc_id`, `public_subnets`          | Handy when troubleshooting networking or adding new modules later. |

---

## Extending the Stack

To add more infrastructure:

1. Create a new module under `modules/` (follow the existing pattern of `main.tf`, `variables.tf`, `outputs.tf`).
2. Instantiate it from `main.tf`, passing `local.common_tags` where possible.
3. Expose any values you need for Ansible via `outputs.tf` and, if necessary, update `ansible.tf`.
4. Update this README and the GitHub secrets/workflows if new credentials or parameters are required.

This keeps the root module declarative and allows the workflows to stay unchanged most of the time.
