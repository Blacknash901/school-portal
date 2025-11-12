# GitHub Secrets Setup Guide

This guide helps you set up all required GitHub secrets for automated deployment.

## 🚀 Quick Start

1. **Go to your GitHub repository**
   - Navigate to: `Settings → Secrets and variables → Actions`
   - Click `New repository secret`

2. **Add each secret** listed below

3. **Test deployment** by running the workflow manually

---

## 📋 Required Secrets Checklist

### ✅ Application Secrets (Required)

- [ ] `REACT_APP_MSAL_CLIENT_ID` - Azure AD client ID
- [ ] `REACT_APP_MSAL_TENANT_ID` - Azure AD tenant ID
- [ ] `REACT_APP_AZURE_CLIENT_ID` - Azure client ID (usually same as MSAL)
- [ ] `REACT_APP_AZURE_TENANT_ID` - Azure tenant ID (usually same as MSAL)
- [ ] `REACT_APP_REDIRECT_URI` - Production redirect URI (e.g., `https://portal.cecre.net`)

### ✅ Docker Hub (Required)

- [ ] `DOCKER_USERNAME` - Docker Hub username
- [ ] `DOCKER_PASSWORD` - Docker Hub password or access token

### ✅ Self-Hosted Runner Secrets (Option 1)

- [ ] `PRODUCTION_IP` - Production server IP
- [ ] `PRODUCTION_DOMAIN` - Production domain (e.g., `portal.cecre.net`)
- [ ] `USE_IP` - Use IP instead of domain (`true` or `false`)
- [ ] `USE_HTTPS` - Use HTTPS (`true` or `false`)
- [ ] `LETSENCRYPT_EMAIL` - Email for Let's Encrypt (e.g., `jmadriz@cecre.net`)
- [ ] `K8S_NAMESPACE` - Kubernetes namespace (usually `default`)
- [ ] `ANSIBLE_USER` - SSH username (for local execution)

### ✅ Ansible Deployment Secrets (Option 2)

- [ ] `ANSIBLE_HOST` - Server IP or hostname (e.g., `192.168.0.134`)
- [ ] `ANSIBLE_USER` - SSH username (e.g., `ubuntu` or `terya`)
- [ ] `ANSIBLE_SSH_PRIVATE_KEY` - SSH private key (see instructions below)
- [ ] `PRODUCTION_IP` - Production server IP
- [ ] `PRODUCTION_DOMAIN` - Production domain (e.g., `portal.cecre.net`)
- [ ] `USE_IP` - Use IP instead of domain (`true` or `false`)
- [ ] `USE_HTTPS` - Use HTTPS (`true` or `false`)
- [ ] `LETSENCRYPT_EMAIL` - Email for Let's Encrypt (e.g., `jmadriz@cecre.net`)
- [ ] `K8S_NAMESPACE` - Kubernetes namespace (usually `default`)

### ⚙️ Optional Secrets

- [ ] `REACT_APP_S3_BUCKET_NAME` - S3 bucket name
- [ ] `REACT_APP_S3_REGION` - AWS region (e.g., `us-east-1`)
- [ ] `REACT_APP_S3_ACCESS_KEY_ID` - AWS access key ID
- [ ] `REACT_APP_S3_SECRET_ACCESS_KEY` - AWS secret access key
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key ID (server-side)
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret access key (server-side)
- [ ] `AWS_REGION` - AWS region
- [ ] `S3_BUCKET_NAME` - S3 bucket name (server-side)
- [ ] `REACT_APP_SENTRY_DSN` - Sentry DSN for frontend
- [ ] `REACT_APP_SENTRY_ENVIRONMENT` - Environment (e.g., `production`)
- [ ] `REACT_APP_ENABLE_SENTRY` - Enable Sentry (`true` or `false`)
- [ ] `SENTRY_DSN` - Sentry DSN for backend
- [ ] `REACT_APP_WORDPRESS_FEED_URL` - WordPress RSS feed URL
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID

---

## 📝 Detailed Instructions

### Getting Your Azure AD Credentials

1. **Go to Azure Portal**
   - Navigate to: `Azure Active Directory → App registrations`
   - Find your app registration

2. **Get Client ID**
   - Copy the `Application (client) ID`
   - Add to secret: `REACT_APP_MSAL_CLIENT_ID` and `REACT_APP_AZURE_CLIENT_ID`

3. **Get Tenant ID**
   - Copy the `Directory (tenant) ID`
   - Add to secret: `REACT_APP_MSAL_TENANT_ID` and `REACT_APP_AZURE_TENANT_ID`

4. **Get Redirect URI**
   - Go to `Authentication` → `Platform configurations`
   - Copy the redirect URI (e.g., `https://portal.cecre.net`)
   - Add to secret: `REACT_APP_REDIRECT_URI`

### Getting Your SSH Private Key (Ansible)

**Option 1: If you have the key file locally**

```bash
# Display the key (copy entire output including BEGIN/END lines)
cat ~/.ssh/id_rsa

# Or if using a specific key:
cat /path/to/your/key.pem
```

**Option 2: Generate a new key**

```bash
# Generate new SSH key
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"

# Copy the private key
cat ~/.ssh/id_rsa

# Add public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server-ip
```

**Important:** When adding to GitHub secret `ANSIBLE_SSH_PRIVATE_KEY`:
- Include the entire key including:
  - `-----BEGIN RSA PRIVATE KEY-----`
  - All key content
  - `-----END RSA PRIVATE KEY-----`
- Copy exactly as shown (no extra spaces or line breaks)


### Getting Your Docker Hub Credentials

1. **Go to Docker Hub**
   - Navigate to: `Account Settings → Security`
   - Create an access token (recommended) or use password

2. **Add Secrets**
   - `DOCKER_USERNAME` - Your Docker Hub username
   - `DOCKER_PASSWORD` - Your access token or password

---

## 🔍 Verifying Secrets

### Check if Secrets Are Set

1. Go to: `Settings → Secrets and variables → Actions`
2. You should see all your secrets listed (values are hidden)

### Test Deployment

1. Go to: `Actions → Deploy to Production`
2. Click `Run workflow`
3. Select deployment type: `app`
4. Click `Run workflow`
5. Check the workflow logs for any missing secrets

---

## 🛠️ Troubleshooting

### Secret Not Found Error

**Problem:** Workflow fails with "Secret not found"

**Solution:**
- Verify secret name matches exactly (case-sensitive)
- Check secret is in the correct repository
- Ensure secret is added under `Actions` secrets (not environment secrets)

### SSH Connection Failed (Ansible)

**Problem:** Ansible can't connect to server

**Solution:**
- Verify `ANSIBLE_HOST` and `ANSIBLE_USER` are correct
- Check SSH key includes BEGIN/END lines
- Test SSH connection manually: `ssh -i key.pem user@host`
- Verify server firewall allows SSH (port 22)


### Missing Environment Variables

**Problem:** App works but some features don't work

**Solution:**
- Check optional secrets are set (S3, Sentry, etc.)
- Verify secret values are correct
- Check deployment logs for errors

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Ansible Deployment Guide](.github/DEPLOYMENT-GUIDE.md)
- [Environment Variables Guide](docs/guides/ENVIRONMENT-VARIABLES.md)

---

## 💡 Tips

1. **Use Access Tokens** instead of passwords when possible (Docker Hub, AWS, etc.)
2. **Rotate Secrets Regularly** for security
3. **Test in Staging** before production deployment
4. **Keep Secrets Organized** - use consistent naming
5. **Document Secret Sources** - note where each secret comes from

---

**Need Help?** Check the troubleshooting section or review the deployment guide.

