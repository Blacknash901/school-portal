# Deployment Documentation

This directory contains all deployment-related configuration for the School Portal application.

---

## 📁 Directory Structure

```
deployment/
├── ansible/                       # Ansible playbooks (recommended)
│   ├── deploy-all.yml             # Full deployment (fresh instances)
│   ├── deploy-app.yml             # App updates only (fast!)
│   ├── deploy-monitoring.yml      # Optional monitoring
│   ├── setup-infrastructure.yml   # Infrastructure setup
│   ├── inventory-production.yml   # Server configuration
│   └── PLAYBOOK-GUIDE.md          # Complete playbook guide
│
├── prometheus-deployment.yaml     # Prometheus configuration
├── grafana-deployment.yaml        # Grafana with pre-configured dashboards
├── monitoring.yaml                # HPA, PDB, alert rules
├── iam-policy.json                # AWS IAM policy for logging
├── iam-trust-policy.json          # AWS IAM trust policy
├── Dockerfile                     # Docker build configuration
│
├── DEPLOYMENT.md                  # Comprehensive deployment guide
├── QUICK-START-PRODUCTION.md      # Quick start for production
├── HTTPS-WITH-IP.md               # HTTPS setup with IP addresses
├── MONITORING-GUIDE.md            # Monitoring setup and usage
└── prometheus-queries.md          # Example Prometheus queries
```

---

## 🚀 Quick Start

### Fresh Instance Deployment

```bash
# 1. Build and push Docker image
cd /path/to/school-portal
./build-production.sh 1.0.11 ip

# 2. Create ARM EC2 instance
#    - Type: t4g.medium
#    - AMI: Ubuntu 22.04 ARM64
#    - Storage: 20GB
#    - Security Group: 22, 80, 443, 30443, 30090, 30300

# 3. Update inventory
cd deployment/ansible
vim inventory-production.yml
# Update: ansible_host and production_ip

# 4. Deploy everything
ansible-playbook -i inventory-production.yml deploy-all.yml

# 5. Update Azure AD redirect URI
#    https://YOUR_IP:30443
```

**Time:** ~15 minutes for full deployment

---

## ⚡ Daily Development (Code Updates)

```bash
# 1. Build new version
./build-production.sh 1.0.12 ip

# 2. Update inventory version
vim deployment/ansible/inventory-production.yml
# Change: app_version: "1.0.12"

# 3. Deploy app only
cd deployment/ansible
ansible-playbook -i inventory-production.yml deploy-app.yml
```

**Time:** ~3 minutes (5x faster than full deployment!)

---

## 📖 Documentation

### Essential Guides

1. **[PLAYBOOK-GUIDE.md](./ansible/PLAYBOOK-GUIDE.md)** ⭐

   - Complete guide to all playbooks
   - When to use each one
   - Common workflows
   - Troubleshooting

2. **[DEPLOY-ARM-GUIDE.md](../DEPLOY-ARM-GUIDE.md)** 🚀

   - ARM/Graviton deployment guide
   - Why ARM is better for this project
   - AWS instance setup
   - Complete walkthrough

3. **[DEPLOYMENT.md](./DEPLOYMENT.md)**

   - Comprehensive deployment reference
   - All scenarios covered
   - Architecture decisions
   - Advanced configurations

4. **[MONITORING-GUIDE.md](./MONITORING-GUIDE.md)** 📊

   - Prometheus + Grafana setup
   - Dashboard usage
   - Alert configuration
   - Troubleshooting metrics

5. **[QUICK-START-PRODUCTION.md](./QUICK-START-PRODUCTION.md)**
   - Quick reference for production deployment
   - Step-by-step checklist
   - Common issues and fixes

---

## 🎯 Deployment Options

### Option 1: Modular Ansible (Recommended) ⭐

**Best for:** Production deployments, team environments, repeatable deployments

**Playbooks:**

- `deploy-all.yml` - Fresh instances (15 min)
- `deploy-app.yml` - App updates (3 min)
- `deploy-monitoring.yml` - Add monitoring (5 min)
- `setup-infrastructure.yml` - Infrastructure only (8 min)

**Pros:**

- ✅ Automated and repeatable
- ✅ Fast updates (3 min for app changes)
- ✅ Modular (run only what you need)
- ✅ Production-tested

**Guide:** [ansible/PLAYBOOK-GUIDE.md](./ansible/PLAYBOOK-GUIDE.md)

---

### Option 2: Docker

**Best for:** Local testing, development, simple deployments

```bash
# Build
./build-production.sh 1.0.11 ip

# Deploy
docker run -d \
  -p 3443:3443 \
  --env-file .env \
  -v $(pwd)/certs:/app/certs:ro \
  blacknash/cecre:1.0.11
```

**Pros:**

- ✅ Simple and fast
- ✅ Good for testing
- ✅ No infrastructure setup

**Cons:**

- ❌ No auto-scaling
- ❌ No monitoring
- ❌ Manual updates

---

### Option 3: Manual Kubernetes

**Best for:** Custom Kubernetes setups, learning, advanced configurations

```bash
# Apply manifests manually
kubectl apply -f deployment/prometheus-deployment.yaml
kubectl apply -f deployment/grafana-deployment.yaml
kubectl apply -f deployment/monitoring.yaml

# Create secrets manually
kubectl create secret generic school-portal-secrets \
  --from-env-file=.env

# Apply custom deployment
kubectl apply -f your-custom-deployment.yaml
```

**Pros:**

- ✅ Full control
- ✅ Customizable

**Cons:**

- ❌ More manual work
- ❌ Harder to maintain

---

## 🏗️ Architecture

### Deployment Stack

```
┌─────────────────────────────────────────────────┐
│          AWS EC2 (t4g.medium - ARM64)           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │       MicroK8s Kubernetes Cluster       │   │
│  ├─────────────────────────────────────────┤   │
│  │                                         │   │
│  │  Namespace: default                     │   │
│  │  ├─ school-portal (2-5 replicas)       │   │
│  │  │   └─ NodePort 30443 (HTTPS)         │   │
│  │                                         │   │
│  │  Namespace: monitoring                  │   │
│  │  ├─ Prometheus                          │   │
│  │  │   └─ NodePort 30090                  │   │
│  │  └─ Grafana                             │   │
│  │      └─ NodePort 30300                  │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Component Versions

- **MicroK8s:** 1.28/stable
- **Node.js:** 18-alpine
- **Prometheus:** Latest
- **Grafana:** Latest (with pre-configured dashboards)

---

## 📊 Monitoring

After deploying with monitoring, you'll have access to:

### Grafana Dashboard

- **URL:** `http://your-ip:30300`
- **Login:** `admin` / `admin`
- **Dashboard:** "School Portal Monitoring" (pre-configured)
- **Metrics:** HTTP requests, errors, CPU, memory, rate limits

### Prometheus

- **URL:** `http://your-ip:30090`
- **Features:** Metrics explorer, custom queries, alert rules

### Auto-Scaling

- **Min replicas:** 2
- **Max replicas:** 5
- **Triggers:** CPU > 70%, Memory > 80%

### Alerts

- Pod crash looping
- High memory usage (> 80%)
- High CPU usage (> 80%)
- High rate limit hits
- Deployment has no replicas

**Full Guide:** [MONITORING-GUIDE.md](./MONITORING-GUIDE.md)

---

## 🔒 Security

### Firewall Rules (UFW)

```
Port 22     - SSH
Port 80     - HTTP (redirect to HTTPS)
Port 443    - HTTPS
Port 30443  - Kubernetes NodePort (App HTTPS)
Port 30090  - Kubernetes NodePort (Prometheus)
Port 30300  - Kubernetes NodePort (Grafana)
```

### AWS Security Group

Same ports as above, allow from `0.0.0.0/0`

### SSL/TLS

- Self-signed certificates for IP-based deployments
- Let's Encrypt for domain-based deployments

---

## 🛠️ Troubleshooting

### Common Issues

#### Pods not starting

```bash
# Check pod status
kubectl get pods

# View logs
kubectl logs -l app=school-portal --tail=50

# Describe pod for events
kubectl describe pod <pod-name>
```

#### Can't access app

```bash
# Check service
kubectl get svc school-portal-service

# Check firewall
sudo ufw status

# Verify AWS Security Group allows port 30443
```

#### Monitoring not working

```bash
# Check monitoring namespace
kubectl get pods -n monitoring

# Check metrics-server
kubectl get pods -n kube-system | grep metrics-server

# Redeploy monitoring
ansible-playbook -i inventory-production.yml deploy-monitoring.yml
```

**Complete Troubleshooting:** [ansible/PLAYBOOK-GUIDE.md#troubleshooting](./ansible/PLAYBOOK-GUIDE.md#troubleshooting)

---

## 📝 Configuration

### Inventory File (`ansible/inventory-production.yml`)

Update these variables before deploying:

```yaml
all:
  hosts:
    production-server:
      ansible_host: YOUR_IP # ⚠️ Update this!
      ansible_user: ubuntu
      ansible_ssh_private_key_file: /path/to/key.pem

  vars:
    app_name: school-portal
    app_version: "1.0.11" # ⚠️ Update for each release
    docker_registry: blacknash/cecre
    production_ip: YOUR_IP # ⚠️ Update this!
    use_ip: true # false when DNS is ready
    use_https: true
```

### Environment Variables

Configure `.env` in project root. See `env.example` for all options.

**Key Variables:**

- `REACT_APP_MSAL_CLIENT_ID` - Azure AD client ID
- `REACT_APP_MSAL_TENANT_ID` - Azure AD tenant ID
- `REACT_APP_REDIRECT_URI` - OAuth redirect URI (set by build script)

---

## 🎓 Best Practices

### ✅ Do:

- Use `deploy-app.yml` for code updates (faster)
- Version your Docker images (1.0.11, 1.0.12, etc.)
- Test locally before deploying to production
- Keep inventory file updated with correct version
- Back up `.env` file securely

### ❌ Don't:

- Don't use `deploy-all.yml` for updates (slow)
- Don't skip versioning (using only `latest`)
- Don't commit `.env` files to git
- Don't forget to update Azure AD redirect URI
- Don't deploy without pushing Docker image first

---

## 📚 Additional Resources

- [Main README](../README.md)
- [Environment Variables Guide](../docs/guides/ENVIRONMENT-VARIABLES.md)
- [HTTPS Setup Guide](../docs/guides/HTTPS-SETUP-GUIDE.md)
- [Security Guide](../docs/guides/SECURITY-MONITORING-GUIDE.md)
- [Testing Guide](../docs/guides/TESTING-GUIDE.md)

---

## 🆘 Getting Help

1. **Check the guides** - Most questions are answered in the documentation
2. **Review playbook output** - Ansible shows detailed error messages
3. **Check logs** - `kubectl logs` and `kubectl describe` are your friends
4. **Read error messages** - They usually tell you exactly what's wrong

---

**Last Updated:** October 2024  
**Maintained by:** School Portal Team
