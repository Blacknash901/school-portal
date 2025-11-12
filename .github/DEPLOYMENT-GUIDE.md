# Deployment Guide - GitHub Actions

This guide explains how to deploy the School Portal to your personal server using GitHub Actions with secrets stored in GitHub.

## 🎯 Two Deployment Options

### Option 1: Self-Hosted Runner (Recommended for Personal Servers) ⭐

**Best for:** Personal servers without public IP

- Runs GitHub Actions runner on your personal server
- No public IP needed
- Works with local/private networks
- Executes Ansible locally (no SSH needed)
- **Workflow:** `.github/workflows/deploy-self-hosted.yml`
- **Setup:** See [Self-Hosted Runner Setup Guide](SELF-HOSTED-RUNNER-SETUP.md)

### Option 2: Ansible Deployment (For Servers with Public IP)

**Best for:** Servers with public IP or VPN access

- Uses Ansible playbooks (same as local deployment)
- Works with MicroK8s on EC2/VM
- Full infrastructure management
- **Requires:** Server with public IP or VPN access
- **Workflow:** `.github/workflows/deploy.yml`

---

## 📋 Required GitHub Secrets

Configure these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets (Both Options)

#### Application Secrets
- `REACT_APP_MSAL_CLIENT_ID` - Azure AD client ID
- `REACT_APP_MSAL_TENANT_ID` - Azure AD tenant ID
- `REACT_APP_AZURE_CLIENT_ID` - Azure client ID
- `REACT_APP_AZURE_TENANT_ID` - Azure tenant ID
- `REACT_APP_REDIRECT_URI` - Production redirect URI (e.g., `https://portal.cecre.net`)

#### Docker Hub
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token

### Option 1: Self-Hosted Runner Secrets

#### Deployment Configuration
- `PRODUCTION_IP` - Production server IP
- `PRODUCTION_DOMAIN` - Production domain (e.g., `portal.cecre.net`)
- `USE_IP` - Use IP instead of domain (`true` or `false`)
- `USE_HTTPS` - Use HTTPS (`true` or `false`)
- `LETSENCRYPT_EMAIL` - Email for Let's Encrypt (e.g., `jmadriz@cecre.net`)
- `K8S_NAMESPACE` - Kubernetes namespace (usually `default`)
- `ANSIBLE_USER` - SSH username (for local execution)

### Option 2: Ansible Deployment Secrets

#### Server Access
- `ANSIBLE_HOST` - Server IP or hostname (e.g., `192.168.0.134`)
- `ANSIBLE_USER` - SSH username (e.g., `ubuntu` or `terya`)
- `ANSIBLE_SSH_PRIVATE_KEY` - SSH private key content (entire key, including `-----BEGIN RSA PRIVATE KEY-----`)

#### Deployment Configuration
- `PRODUCTION_IP` - Production server IP
- `PRODUCTION_DOMAIN` - Production domain (e.g., `portal.cecre.net`)
- `USE_IP` - Use IP instead of domain (`true` or `false`)
- `USE_HTTPS` - Use HTTPS (`true` or `false`)
- `LETSENCRYPT_EMAIL` - Email for Let's Encrypt (e.g., `jmadriz@cecre.net`)
- `K8S_NAMESPACE` - Kubernetes namespace (usually `default`)

### Optional Secrets (Both Options)

#### AWS S3 Logging
- `REACT_APP_S3_BUCKET_NAME` - S3 bucket name
- `REACT_APP_S3_REGION` - AWS region (e.g., `us-east-1`)
- `REACT_APP_S3_ACCESS_KEY_ID` - AWS access key ID
- `REACT_APP_S3_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_ACCESS_KEY_ID` - AWS access key ID (server-side)
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key (server-side)
- `AWS_REGION` - AWS region
- `S3_BUCKET_NAME` - S3 bucket name (server-side)

#### Sentry Error Tracking
- `REACT_APP_SENTRY_DSN` - Sentry DSN for frontend
- `REACT_APP_SENTRY_ENVIRONMENT` - Environment (e.g., `production`)
- `REACT_APP_ENABLE_SENTRY` - Enable Sentry (`true` or `false`)
- `SENTRY_DSN` - Sentry DSN for backend

#### Other Services
- `REACT_APP_WORDPRESS_FEED_URL` - WordPress RSS feed URL
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID

---

## 🚀 How to Deploy

### Method 1: Manual Deployment (Workflow Dispatch)

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Personal Server** (self-hosted) or **Deploy to Production** (Ansible)
3. Click **Run workflow**
4. Choose deployment type:
   - **app** - Deploy application only (fast, ~2-3 minutes)
   - **all** - Deploy everything (infrastructure + app + monitoring, ~15 minutes)
   - **monitoring** - Deploy monitoring only (~5 minutes)
5. (Optional) Enter app version (leave empty to use package.json version)
6. Click **Run workflow**

### Method 2: Automatic Deployment (Push to Main)

The workflow automatically triggers when you push to `main` or `master` branch.

**Note:** Only pushes that modify code (not docs) will trigger deployment.

---

## 🔧 Option 1: Self-Hosted Runner Details

### What It Does

1. Runner executes on your personal server
2. Generates `.env` file from GitHub secrets
3. Generates dynamic inventory file from GitHub secrets
4. Runs Ansible playbook locally:
   - `deploy-app.yml` - Application deployment
   - `deploy-all.yml` - Full deployment (infrastructure + app + monitoring)
   - `deploy-monitoring.yml` - Monitoring only

### Prerequisites

- Self-hosted runner installed on your server (see [SELF-HOSTED-RUNNER-SETUP.md](SELF-HOSTED-RUNNER-SETUP.md))
- MicroK8s installed (or will be installed by Ansible)
- Docker image already built and pushed to Docker Hub

### Workflow Steps

```yaml
1. Checkout code (on your server)
2. Extract version from package.json
3. Generate .env file from secrets
4. Generate inventory file from secrets
5. Check/Install Ansible
6. Run Ansible playbook (locally)
7. Deployment complete
```

### Setup

See [Self-Hosted Runner Setup Guide](SELF-HOSTED-RUNNER-SETUP.md) for detailed instructions.

---

## 🔧 Option 2: Ansible Deployment Details

### What It Does

1. Generates `.env` file from GitHub secrets
2. Generates dynamic inventory file from GitHub secrets
3. Sets up SSH key for server access
4. Installs Ansible
5. Runs Ansible playbook via SSH:
   - `deploy-app.yml` - Application deployment
   - `deploy-all.yml` - Full deployment (infrastructure + app + monitoring)
   - `deploy-monitoring.yml` - Monitoring only

### Prerequisites

- Server with SSH access (public IP or VPN)
- MicroK8s installed (or will be installed by Ansible)
- Docker image already built and pushed to Docker Hub

### Workflow Steps

```yaml
1. Checkout code
2. Extract version from package.json
3. Generate .env file from secrets
4. Generate inventory file from secrets
5. Setup SSH key
6. Install Ansible
7. Run Ansible playbook (via SSH)
8. Cleanup
```

---

## 📝 Setting Up GitHub Secrets

### Step-by-Step Guide

1. **Go to GitHub Repository**
   - Navigate to your repository
   - Click **Settings** → **Secrets and variables** → **Actions**

2. **Add Each Secret**
   - Click **New repository secret**
   - Enter secret name (e.g., `REACT_APP_MSAL_CLIENT_ID`)
   - Enter secret value
   - Click **Add secret**

3. **Repeat for All Secrets**
   - Add all required secrets listed above
   - Optional secrets can be added later

### Getting SSH Private Key for Ansible (Option 2)

```bash
# If you have the key file locally:
cat ~/.ssh/id_rsa

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ...key content...
# -----END RSA PRIVATE KEY-----

# Paste it into GitHub secret: ANSIBLE_SSH_PRIVATE_KEY
```

For detailed instructions, see [SECRETS-SETUP.md](SECRETS-SETUP.md).

---

## 🔄 Deployment Workflow

### Typical Workflow

1. **Make code changes**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **GitHub Actions automatically:**
   - Runs tests
   - Builds Docker image
   - Pushes to Docker Hub
   - Triggers deployment (if configured)

3. **Or manually trigger:**
   - Go to Actions → Deploy to Personal Server
   - Click Run workflow

### Version Management

- Version is automatically extracted from `package.json`
- You can override version in manual deployment
- Docker image tag: `blacknash/cecre:1.0.16` (matches package.json version)

---

## 🐛 Troubleshooting

### Self-Hosted Runner Issues

**Runner Not Appearing in GitHub:**
- Check internet connection on server
- Verify token is correct
- Check firewall allows outbound HTTPS (port 443)
- Review runner logs: `cd actions-runner && ./run.sh`

**Runner Offline:**
- Check service status: `sudo systemctl status actions.runner.*.service`
- Check logs: `sudo journalctl -u actions.runner.*.service -f`
- Restart service: `sudo ./svc.sh restart`

**Ansible Not Found:**
- The workflow installs Ansible automatically
- Or install manually: `sudo apt-get install ansible` or `pip3 install ansible`

### Ansible Deployment Issues

**SSH Connection Failed:**
- Check `ANSIBLE_HOST` and `ANSIBLE_USER` secrets
- Verify SSH key is correct (include BEGIN/END lines)
- Check server firewall allows SSH (port 22)

**Playbook Fails:**
- Check server has required permissions
- Verify Docker image exists: `docker pull blacknash/cecre:VERSION`
- Check server logs: `ssh user@host "microk8s kubectl get pods"`

### General Issues

**Secrets Not Found:**
- Verify all required secrets are set in GitHub
- Check secret names match exactly (case-sensitive)

**Image Pull Failed:**
- Verify Docker image exists: `docker pull blacknash/cecre:VERSION`
- Check `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets

---

## 🎯 Best Practices

### ✅ Do:
- Use self-hosted runner for personal servers
- Use manual deployment for testing
- Use automatic deployment for production
- Keep secrets secure (never commit them)
- Test deployment in staging first
- Monitor deployment logs in GitHub Actions

### ❌ Don't:
- Don't commit `.env` files
- Don't hardcode secrets in code
- Don't use `latest` tag for production
- Don't skip version updates

---

## 📊 Comparison: Self-Hosted Runner vs Ansible Deployment

| Feature | Self-Hosted Runner | Ansible Deployment |
|---------|-------------------|-------------------|
| **Public IP Required** | ❌ No | ✅ Yes |
| **Setup Complexity** | Low | Medium |
| **Setup Time** | ~5 min | ~15 min |
| **Deployment Time** | ~2-3 min | ~2-3 min |
| **Infrastructure Management** | ✅ Full | ✅ Full |
| **Works With** | Local/private networks | Public IP or VPN |
| **Best For** | Personal servers | Servers with public IP |

---

## 🔗 Related Documentation

- [Self-Hosted Runner Setup](SELF-HOSTED-RUNNER-SETUP.md) - Detailed runner setup guide
- [Secrets Setup](SECRETS-SETUP.md) - Step-by-step secrets configuration
- [Ansible Playbook Guide](../deployment/ansible/PLAYBOOK-GUIDE.md) - Ansible playbook details
- [Docker Build Workflow](workflows/docker-build.yml) - Docker image build process

---

## 💡 Quick Reference

### Manual Deployment
```
Actions → Deploy to Personal Server → Run workflow → Choose type → Run
```

### Check Deployment Status
```bash
# SSH to server:
ssh user@host "microk8s kubectl get pods"

# Or if runner is on server:
microk8s kubectl get pods
```

### View Logs
```bash
# SSH to server:
ssh user@host "microk8s kubectl logs -n namespace deployment/school-portal"

# Or if runner is on server:
microk8s kubectl logs -n namespace deployment/school-portal
```

---

**Need Help?** Check the troubleshooting section or review the workflow logs in GitHub Actions.
