## # Ansible Playbook Guide

## 📚 Playbook Structure

We use a **modular approach** for flexibility and efficiency:

```
deployment/ansible/
├── inventory-production.yml       # Server configuration
│
├── deploy-all.yml                 # ⭐ Master playbook (fresh instances)
│
├── setup-infrastructure.yml       # Docker, MicroK8s, firewall
├── deploy-app.yml                 # Application deployment
└── deploy-monitoring.yml          # Prometheus + Grafana
```

---

## 🎯 Which Playbook to Use?

### **Fresh Instance** → `deploy-all.yml`

When you have a **brand new server** and want to set up everything:

```bash
ansible-playbook -i inventory-production.yml deploy-all.yml
```

**What it does:**

- ✅ Installs Docker & MicroK8s
- ✅ Deploys your application
- ✅ Sets up monitoring
- ✅ Configures firewall

**Time:** ~10-15 minutes  
**Frequency:** Once per server

---

### **Code Update** → `deploy-app.yml` ⚡

When you've made **code changes** and want to deploy a new version:

```bash
# 1. Build and push new version
./build-production.sh 1.0.12 ip

# 2. Update version in inventory
vim deployment/ansible/inventory-production.yml
# Change: app_version: "1.0.12"

# 3. Deploy
ansible-playbook -i inventory-production.yml deploy-app.yml
```

**What it does:**

- ✅ Pulls new Docker image
- ✅ Updates Kubernetes deployment
- ✅ Restarts pods with new version

**Time:** ~2-3 minutes  
**Frequency:** Every code update

**Why not use deploy-all.yml?**

- ❌ Reinstalls Docker (unnecessary)
- ❌ Reinstalls MicroK8s (unnecessary)
- ❌ Takes 15 minutes instead of 2 minutes
- ❌ More prone to errors

---

### **Configuration Change** → `deploy-app.yml`

When you've changed **environment variables** (`.env` file):

```bash
# 1. Update .env file locally
vim .env

# 2. Deploy (no need to rebuild Docker image!)
ansible-playbook -i inventory-production.yml deploy-app.yml
```

**What it does:**

- ✅ Copies new .env file
- ✅ Updates Kubernetes secrets
- ✅ Restarts pods with new config

**Time:** ~2 minutes

---

### **Add Monitoring** → `deploy-monitoring.yml`

When you want to **add monitoring** to an existing deployment:

```bash
ansible-playbook -i inventory-production.yml deploy-monitoring.yml
```

**What it does:**

- ✅ Deploys Prometheus
- ✅ Deploys Grafana with dashboards
- ✅ Enables auto-scaling
- ✅ Configures alerts

**Time:** ~3-5 minutes  
**Frequency:** Once (or to redeploy monitoring)

---

### **Infrastructure Only** → `setup-infrastructure.yml`

When you want to **prepare a server** but not deploy the app yet:

```bash
ansible-playbook -i inventory-production.yml setup-infrastructure.yml
```

**What it does:**

- ✅ Installs Docker
- ✅ Installs MicroK8s
- ✅ Configures firewall

**Time:** ~5-8 minutes  
**Use case:** Preparing servers in advance

---

## 🔄 Common Workflows

### 1. **New Deployment (Everything from Scratch)**

```bash
# Step 1: Build Docker image
./build-production.sh 1.0.11 ip

# Step 2: Update inventory with IP
vim deployment/ansible/inventory-production.yml

# Step 3: Deploy everything
cd deployment/ansible
ansible-playbook -i inventory-production.yml deploy-all.yml

# Step 4: Update Azure AD redirect URI
# https://YOUR_IP:30443
```

**Time:** ~15 minutes total

---

### 2. **Daily Development Cycle (Code Updates)**

```bash
# Step 1: Make code changes
# ... edit files ...

# Step 2: Build new version
./build-production.sh 1.0.12 ip

# Step 3: Update inventory
vim deployment/ansible/inventory-production.yml
# Change: app_version: "1.0.12"

# Step 4: Deploy JUST the app
cd deployment/ansible
ansible-playbook -i inventory-production.yml deploy-app.yml
```

**Time:** ~3 minutes total (build + deploy)

---

### 3. **Environment Variable Change**

```bash
# Step 1: Update .env file
vim .env

# Step 2: Deploy (uses existing Docker image!)
cd deployment/ansible
ansible-playbook -i inventory-production.yml deploy-app.yml
```

**Time:** ~2 minutes

---

### 4. **Add Monitoring to Existing Deployment**

```bash
cd deployment/ansible
ansible-playbook -i inventory-production.yml deploy-monitoring.yml
```

**Time:** ~3-5 minutes

---

### 5. **Disaster Recovery (Server Died)**

```bash
# Same as new deployment - just run deploy-all.yml
cd deployment/ansible
ansible-playbook -i inventory-production.yml deploy-all.yml
```

**Time:** ~15 minutes to full recovery

---

## ⚡ Speed Comparison

| Task                 | Monolithic Playbook            | Modular Approach        | Time Saved |
| -------------------- | ------------------------------ | ----------------------- | ---------- |
| **Fresh deployment** | 15 min                         | 15 min                  | 0 min      |
| **Code update**      | 15 min (reinstalls everything) | 3 min (app only)        | **12 min** |
| **Config change**    | 15 min (reinstalls everything) | 2 min (app only)        | **13 min** |
| **Add monitoring**   | N/A (all or nothing)           | 5 min (monitoring only) | Flexible   |

**Daily development:** If you deploy 5 times a day, you save **~1 hour per day!**

---

## 🛠️ Troubleshooting

### **Playbook Failed - What to Do?**

#### 1. **Infrastructure setup failed:**

```bash
# Just re-run infrastructure setup
ansible-playbook -i inventory-production.yml setup-infrastructure.yml
```

#### 2. **App deployment failed:**

```bash
# Check pods
ssh ubuntu@YOUR_IP
microk8s kubectl get pods

# Re-run app deployment
ansible-playbook -i inventory-production.yml deploy-app.yml
```

#### 3. **Monitoring failed:**

```bash
# Re-run monitoring deployment
ansible-playbook -i inventory-production.yml deploy-monitoring.yml
```

#### 4. **Don't know what failed:**

```bash
# Re-run everything (safest option)
ansible-playbook -i inventory-production.yml deploy-all.yml
```

---

## 🎓 Best Practices

### ✅ **Do:**

- Use `deploy-app.yml` for code updates
- Use `deploy-all.yml` only for fresh instances
- Version your Docker images (`1.0.11`, `1.0.12`, etc.)
- Update `app_version` in inventory before deploying
- Test locally before deploying to production

### ❌ **Don't:**

- Don't use `deploy-all.yml` for updates
- Don't skip versioning (`latest` is not enough)
- Don't forget to update Azure AD redirect URI
- Don't deploy without pushing Docker image first

---

## 📝 Inventory Configuration

Before deploying, update `inventory-production.yml`:

```yaml
all:
  hosts:
    production-server:
      ansible_host: YOUR_IP_HERE # ⚠️ Update this!
      ansible_user: ubuntu
      ansible_ssh_private_key_file: /path/to/key.pem
      ansible_python_interpreter: /usr/bin/python3
      ansible_ssh_common_args: "-o StrictHostKeyChecking=no"

  vars:
    app_name: school-portal
    app_version: "1.0.11" # ⚠️ Update this!
    docker_registry: blacknash/cecre
    production_ip: YOUR_IP_HERE # ⚠️ Update this!
    production_domain: portal.cecre.net
    use_ip: true
    use_https: true
    letsencrypt_email: jmadriz@cecre.net
    k8s_namespace: default
```

---

## 🚀 Quick Reference

| Task                | Command                                                                 | Time   |
| ------------------- | ----------------------------------------------------------------------- | ------ |
| Everything (fresh)  | `ansible-playbook -i inventory-production.yml deploy-all.yml`           | 15 min |
| App only            | `ansible-playbook -i inventory-production.yml deploy-app.yml`           | 3 min  |
| Monitoring only     | `ansible-playbook -i inventory-production.yml deploy-monitoring.yml`    | 5 min  |
| Infrastructure only | `ansible-playbook -i inventory-production.yml setup-infrastructure.yml` | 8 min  |

---

## 💡 Summary

**The modular approach gives you:**

- ⚡ **Faster updates:** 2-3 minutes vs 15 minutes
- 🎯 **Targeted changes:** Update only what you need
- 🐛 **Easier debugging:** Isolate issues quickly
- 🔄 **Flexibility:** Mix and match as needed
- 📦 **Simplicity:** Still one command for fresh instances

**Use `deploy-all.yml` for fresh servers, `deploy-app.yml` for everything else!**
