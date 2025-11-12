# GitHub Actions Deployment

This directory contains GitHub Actions workflows and documentation for automated deployment to personal servers.

## 📁 Files

### Workflows
- **`workflows/deploy-self-hosted.yml`** - Self-hosted runner deployment (recommended for personal servers)
- **`workflows/deploy.yml`** - Ansible-based deployment (for servers with public IP)
- **`workflows/docker-build.yml`** - Docker image build workflow

### Documentation
- **`DEPLOYMENT-GUIDE.md`** - Complete deployment guide
- **`SELF-HOSTED-RUNNER-SETUP.md`** - Self-hosted runner setup guide
- **`SECRETS-SETUP.md`** - Step-by-step secrets setup guide
- **`scripts/generate-secrets-list.sh`** - Helper script to list required secrets

## 🚀 Quick Start

1. **Set up GitHub secrets** (see `SECRETS-SETUP.md`)
2. **Choose deployment method:**
   - **Self-Hosted Runner** (recommended) → For personal servers without public IP
   - **Ansible** → For servers with public IP
3. **Deploy:**
   - Manual: Go to Actions → Run workflow
   - Automatic: Push to `main` branch

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT-GUIDE.md)** - Complete guide with all options
- **[Self-Hosted Runner Setup](SELF-HOSTED-RUNNER-SETUP.md)** - How to set up self-hosted runner
- **[Secrets Setup](SECRETS-SETUP.md)** - How to configure GitHub secrets
- **[Ansible Playbooks](../deployment/ansible/PLAYBOOK-GUIDE.md)** - Ansible playbook details

## 🔧 Workflows

### deploy-self-hosted.yml (Recommended) ⭐

Deploys using self-hosted runner. Best for:
- Personal servers without public IP
- Local/private networks
- Simple setup

**Features:**
- Runs on your personal server
- No public IP needed
- Generates `.env` from GitHub secrets
- Runs Ansible playbooks locally
- Supports: `app`, `all`, `monitoring` deployment types

### deploy.yml (Ansible)

Deploys using Ansible via SSH. Best for:
- Servers with public IP
- EC2/VM instances
- Full infrastructure management

**Features:**
- Generates `.env` from GitHub secrets
- Generates inventory file from GitHub secrets
- Runs Ansible playbooks via SSH
- Supports: `app`, `all`, `monitoring` deployment types

## 🎯 Which Workflow to Use?

| Use Case | Workflow |
|----------|----------|
| Personal server (no public IP) | `deploy-self-hosted.yml` ⭐ |
| Server with public IP | `deploy.yml` |
| MicroK8s on EC2/VM | `deploy.yml` |
| Need infrastructure setup | Either (both support) |

## 📋 Required Secrets

See `SECRETS-SETUP.md` for complete list.

**Minimum required:**
- Application secrets (Azure AD)
- Docker Hub credentials
- Deployment configuration (IP, domain, etc.)

## 🔗 Related

- [Docker Build Workflow](workflows/docker-build.yml)
- [Ansible Playbooks](../deployment/ansible/)
- [Environment Variables](../docs/guides/ENVIRONMENT-VARIABLES.md)
