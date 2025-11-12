# 🚀 School Portal Deployment Guide

Complete guide for deploying the School Portal application from development to production.

## 📚 Table of Contents

1. [Quick Start (Development)](#quick-start-development)
2. [Production Deployment with Ansible](#production-deployment)
3. [Manual Deployment](#manual-deployment)
4. [Mobile/Network Testing](#mobile-testing)
5. [Troubleshooting](#troubleshooting)

---

## 🏃 Quick Start (Development)

### Local Development with HTTPS

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your Azure AD credentials

# 3. Build the app
npm run build

# 4. Run HTTPS server
npm run server:https
```

Access at:

- **Local**: `https://localhost:3443`
- **Network**: `https://YOUR_IP:3443` (from phone/other devices)

> **Note**: Accept the certificate warning (self-signed certificate)

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Azure AD (REQUIRED)
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_TENANT_ID=your-tenant-id

# Server
NODE_ENV=development

# Sentry (OPTIONAL)
SENTRY_DSN=your-backend-dsn
REACT_APP_SENTRY_DSN=your-frontend-dsn
REACT_APP_SENTRY_ENVIRONMENT=development
REACT_APP_ENABLE_SENTRY=true
```

---

## 🌐 Production Deployment

### Option 1: Automated Ansible Deployment (Recommended)

**Deploy to a fresh Ubuntu VM with a single command!**

#### Prerequisites:

- Ubuntu 20.04+ server with SSH access
- Domain name (e.g., `portal.cecre.net`) pointing to your server
- Ansible installed on your local machine

#### Steps:

1. **Install Ansible** (if not already installed):

   ```bash
   # macOS
   brew install ansible

   # Ubuntu/Debian
   sudo apt update && sudo apt install ansible
   ```

2. **Configure inventory**:

   ```bash
   cd deployment/ansible
   nano inventory.yml
   ```

   Update with your server details:

   ```yaml
   all:
     hosts:
       production:
         ansible_host: YOUR_SERVER_IP
         ansible_user: ubuntu

         vars:
           domain_name: portal.cecre.net
           email: admin@cecre.net
   ```

3. **Test connection**:

   ```bash
   ansible all -i inventory.yml -m ping
   ```

4. **Deploy**:

   ```bash
   ansible-playbook -i inventory.yml playbook.yml
   ```

5. **Access your app**:
   ```
   https://portal.cecre.net
   ```

**What the playbook does:**

- ✅ Installs Docker
- ✅ Installs MicroK8s (Kubernetes)
- ✅ Builds Docker image
- ✅ Creates Kubernetes Deployment, Service, Ingress
- ✅ Sets up Let's Encrypt SSL certificate
- ✅ Configures environment variables from `.env`
- ✅ Enables health checks and auto-scaling

**Full documentation**: [deployment/ansible/README.md](./deployment/ansible/README.md)

---

### Option 2: Docker Deployment

```bash
# Build image
docker build -t school-portal:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -p 3443:3443 \
  --env-file .env \
  --name school-portal \
  school-portal:latest

# View logs
docker logs -f school-portal
```

---

### Option 3: Kubernetes (Manual)

```bash
# Create namespace
kubectl create namespace school-portal

# Create secrets from .env
kubectl create secret generic school-portal-secrets \
  --from-env-file=.env \
  --namespace=school-portal

# Apply Kubernetes manifests
kubectl apply -f k8s-production.yaml

# Check status
kubectl get pods -n school-portal
kubectl get svc -n school-portal
kubectl get ingress -n school-portal
```

---

## 📱 Mobile/Network Testing

### Fix: Microsoft Login Redirect Issue

**Problem**: After signing in from phone, redirects to `localhost:3000`

**Solution**: Add your IP/domain to Azure AD redirect URIs

1. Go to **Azure Portal** → **App Registrations** → Your app → **Authentication**
2. Add these redirect URIs:
   ```
   http://localhost:3000
   https://localhost:3443
   https://YOUR_IP:3443
   https://portal.cecre.net
   ```
3. Save

**Full guide**: [docs/guides/AZURE-AD-MOBILE-ACCESS.md](./docs/guides/AZURE-AD-MOBILE-ACCESS.md)

### Access from Phone

1. **Find your Mac's IP**:

   ```bash
   ipconfig getifaddr en0
   ```

2. **Start HTTPS server**:

   ```bash
   npm run server:https
   ```

3. **On your phone**, go to:

   ```
   https://YOUR_IP:3443
   ```

4. Accept the certificate warning

---

## 🔧 Configuration

### Azure AD Setup

1. **Create App Registration**:

   - Go to Azure Portal → Azure AD → App registrations
   - New registration
   - Name: "School Portal"
   - Supported account types: Single tenant
   - Redirect URI: `https://localhost:3443` (add more later)

2. **Configure Authentication**:

   - Platform: Single-page application
   - Add all redirect URIs (localhost, IPs, domains)
   - Enable ID tokens (optional)

3. **API Permissions**:

   - Microsoft Graph:
     - `User.Read`
     - `User.ReadBasic.All`
     - `GroupMember.Read.All` (for group-based access)

4. **Copy credentials** to `.env`:
   - Application (client) ID → `REACT_APP_AZURE_CLIENT_ID`
   - Directory (tenant) ID → `REACT_APP_AZURE_TENANT_ID`

### SSL Certificates

#### Development (Self-signed):

```bash
# Already generated in certs/
# Valid for 365 days
```

#### Production (Let's Encrypt):

```bash
# Using Ansible (automatic)
ansible-playbook -i deployment/ansible/inventory.yml deployment/ansible/playbook.yml

# OR manually with certbot
sudo certbot certonly --standalone -d portal.cecre.net
```

**Full guide**: [docs/guides/HTTPS-SETUP-GUIDE.md](./docs/guides/HTTPS-SETUP-GUIDE.md)

---

## 🐛 Troubleshooting

### Build fails

```bash
# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build
```

### HTTPS certificate error

**Development**:

- Click "Advanced" → "Proceed to localhost"
- This is normal for self-signed certificates

**Production**:

- Check domain DNS points to server
- Verify port 80/443 are open (for Let's Encrypt)
- Check certificate status: `kubectl get certificate`

### Login redirects to localhost

**Fix**: Add your IP/domain to Azure AD redirect URIs

- See [Mobile Testing](#mobile-testing) section

### Pods not starting (Kubernetes)

```bash
# Check logs
kubectl logs -l app=school-portal -n school-portal

# Check pod status
kubectl describe pod -l app=school-portal -n school-portal

# Common issues:
# - Missing environment variables (check secrets)
# - Image pull errors (check registry)
# - Resource limits (check node resources)
```

### Let's Encrypt certificate not issuing

```bash
# Check certificate status
kubectl describe certificate school-portal-tls

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Common issues:
# - DNS not pointing to server
# - Port 80 blocked (needed for HTTP-01 challenge)
# - Invalid email in ClusterIssuer
```

---

## 📊 Monitoring & Logs

### Local Development

```bash
# Server logs (console)
npm run server:https

# Browser console
# Open DevTools → Console
```

### Production (Kubernetes)

```bash
# Application logs
kubectl logs -f -l app=school-portal -n school-portal

# All events
kubectl get events -n school-portal --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n school-portal
kubectl top nodes

# Health check
curl https://portal.cecre.net/api/health
```

### Sentry (Error Tracking)

If configured, view errors at: https://sentry.io/

---

## 🔐 Security Best Practices

### Production Checklist:

- [ ] Use HTTPS only (force SSL redirect)
- [ ] Environment variables in Kubernetes Secrets (not in code)
- [ ] Enable Sentry error tracking
- [ ] Set up firewall (ports 22, 80, 443 only)
- [ ] Disable SSH password authentication
- [ ] Use strong Azure AD app secrets
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Monitor logs for suspicious activity
- [ ] Set up backup strategy
- [ ] Configure CORS properly (limit origins)
- [ ] Enable rate limiting (already configured)
- [ ] Use Content Security Policy (already configured)

---

## 📁 Project Structure

```
school-portal/
├── deployment/
│   └── ansible/
│       ├── playbook.yml       # Main Ansible playbook
│       ├── inventory.yml      # Server configuration
│       └── README.md          # Ansible guide
├── docs/
│   └── guides/
│       ├── HTTPS-SETUP-GUIDE.md
│       └── AZURE-AD-MOBILE-ACCESS.md
├── src/                       # React app source
├── build/                     # Production build (generated)
├── certs/                     # SSL certificates (development)
├── Dockerfile                 # Docker image definition
├── server.js                  # HTTP server
├── server-https.js            # HTTPS server
├── k8s-production.yaml        # Kubernetes manifests
├── .env                       # Environment variables (DO NOT COMMIT)
└── DEPLOYMENT.md             # This file
```

---

## 🆘 Support & Resources

### Documentation:

- [Ansible Deployment](./deployment/ansible/README.md)
- [HTTPS Setup](./docs/guides/HTTPS-SETUP-GUIDE.md)
- [Mobile Access](./docs/guides/AZURE-AD-MOBILE-ACCESS.md)
- [Kubernetes Deployment](./k8s-production.yaml)

### External Resources:

- [MicroK8s Docs](https://microk8s.io/docs)
- [Azure AD Documentation](https://docs.microsoft.com/azure/active-directory/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Docker Docs](https://docs.docker.com/)

### Quick Commands:

```bash
# Development
npm run server:https          # Start HTTPS server
npm run build                 # Build for production

# Docker
docker build -t school-portal .
docker run -p 3443:3443 school-portal

# Kubernetes
kubectl get all -n school-portal
kubectl logs -f -l app=school-portal
kubectl rollout restart deployment/school-portal

# Ansible
ansible-playbook -i deployment/ansible/inventory.yml deployment/ansible/playbook.yml
```

---

## 🎉 Deployment Checklist

### Pre-deployment:

- [ ] `.env` file configured with all variables
- [ ] Azure AD app registration created
- [ ] Redirect URIs configured in Azure AD
- [ ] Domain DNS pointing to server (production)
- [ ] SSH access to server

### Deployment:

- [ ] Run Ansible playbook OR manual deployment
- [ ] Verify pods are running
- [ ] Check SSL certificate issued
- [ ] Test application access
- [ ] Test Microsoft login flow

### Post-deployment:

- [ ] Monitor logs for errors
- [ ] Set up Sentry (optional)
- [ ] Configure backups
- [ ] Set up monitoring/alerts
- [ ] Document any customizations

---

**Happy Deploying! 🚀**

For issues or questions, check the troubleshooting section or review the detailed guides in `docs/guides/`.
