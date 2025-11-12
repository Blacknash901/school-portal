# Quick Start: Production Deployment

**Get your School Portal running on a production server in 10 minutes!**

---

## 📋 Prerequisites

### 1. Server Requirements

- **Ubuntu 20.04 or 22.04** (AWS EC2, DigitalOcean, etc.)
- **Minimum:** 2 vCPU, 4GB RAM, 20GB disk
- **SSH access** with sudo privileges

### 2. AWS Security Group / Firewall Rules

Configure these **before** deployment:

| Port  | Protocol | Purpose                   |
| ----- | -------- | ------------------------- |
| 22    | TCP      | SSH (required!)           |
| 80    | TCP      | HTTP (optional)           |
| 443   | TCP      | HTTPS (for future domain) |
| 30443 | TCP      | **App HTTPS (NodePort)**  |
| 30090 | TCP      | Prometheus monitoring     |
| 30300 | TCP      | Grafana dashboards        |

**⚠️ Critical:** Port **30443** must be open - this is where your app runs!  
**📊 Optional:** Ports **30090** and **30300** for monitoring (Prometheus + Grafana)

### 3. Local Requirements

- Ansible installed (`brew install ansible` on Mac)
- SSH key for server access
- Your `.env` file configured

---

## 🚀 Deployment Steps

### Step 1: Configure Inventory

```bash
cd deployment/ansible
cp inventory-production.yml my-production.yml
```

Edit `my-production.yml`:

```yaml
all:
  hosts:
    production-server:
      ansible_host: YOUR_SERVER_IP # ← Change this
      ansible_user: ubuntu
      ansible_ssh_private_key_file: /path/to/your-key.pem # ← Change this
      ansible_python_interpreter: /usr/bin/python3
      ansible_ssh_common_args: "-o StrictHostKeyChecking=no"

  vars:
    app_name: school-portal
    app_version: "1.0.5"
    docker_registry: your-registry/image # ← Optional: Change if using your own

    production_ip: YOUR_SERVER_IP # ← Change this
    production_domain: portal.yourdomain.com # For future use
    use_ip: true # true = use IP, false = use domain
    use_https: true # Always true for production

    letsencrypt_email: your-email@domain.com
    k8s_namespace: default
```

### Step 2: Test Connection

```bash
ansible -i my-production.yml all -m ping
```

**Expected output:**

```
production-server | SUCCESS => {
    "ping": "pong"
}
```

### Step 3: Deploy!

```bash
ansible-playbook -i my-production.yml playbook-production.yml
```

**This takes 5-10 minutes and:**

1. ✅ Installs Docker & MicroK8s
2. ✅ Enables Kubernetes addons (DNS, storage, ingress)
3. ✅ Copies your application files to server
4. ✅ **Builds Docker image on server** (ensures AMD64 architecture)
5. ✅ Generates self-signed SSL certificates
6. ✅ Creates Kubernetes secrets from `.env`
7. ✅ Deploys 2 pods with health checks
8. ✅ Configures firewall (SSH allowed first - no lockout!)
9. ✅ Sets up NodePort service on port 30443

**Expected final output:**

```
PLAY RECAP *********************************************************************
production-server : ok=34   changed=28   unreachable=0   failed=0
```

---

## 🎉 Success! Access Your App

### URL

```
https://YOUR_SERVER_IP:30443
```

**⚠️ Browser Security Warning**

- You'll see "Your connection is not private"
- This is **expected** - we're using a self-signed certificate
- Click **"Advanced"** → **"Proceed to site"**

---

## 🔐 Configure Azure AD Authentication

**Before login works, add the redirect URI:**

1. Go to https://portal.azure.com
2. **Azure Active Directory** → **App registrations**
3. Select your app
4. **Authentication** → **Platform configurations** → **Web**
5. **Add URI:**
   ```
   https://YOUR_SERVER_IP:30443
   ```
6. **Save**

### Test Login

1. Go to `https://YOUR_SERVER_IP:30443`
2. Accept security warning
3. Click "Sign in with Microsoft"
4. Login should work! ✅

---

## 📊 Monitoring Dashboard

**Your deployment includes Prometheus + Grafana monitoring!**

### Access Grafana

**URL:** `http://YOUR_SERVER_IP:30300`

**Default credentials:**

- Username: `admin`
- Password: `admin`

**⚠️ Change password on first login!**

### What's Included

The monitoring stack automatically tracks:

- ✅ **HTTP requests** (rate, errors, response time)
- ✅ **Pod health** (running, ready, restarts)
- ✅ **Resource usage** (CPU, memory per pod)
- ✅ **Auto-scaling** (2-5 replicas based on load)
- ✅ **Rate limiting** (429 errors)
- ✅ **Error tracking** (4xx, 5xx errors)

### Pre-configured Dashboard

**"School Portal Monitoring"** dashboard shows:

1. **HTTP Request Rate** - Requests per second
2. **Response Time (p95)** - 95th percentile latency
3. **Pod Status** - Number of running pods
4. **Memory Usage** - Percentage of limit
5. **CPU Usage** - Cores in use
6. **Error Rate** - 4xx and 5xx errors
7. **Pod Restarts** - Crash detection
8. **Pod Details** - Table of all pods

### Alerts Configured

The system will detect:

- 🚨 **Pod crash looping** (restarts > 0 in 15min)
- ⚠️ **High memory usage** (> 90% for 10min)
- ⚠️ **High CPU usage** (> 80% for 10min)
- ⚠️ **High error rate** (5xx errors)
- ⚠️ **Rate limiting hits** (429 errors)
- 🚨 **All pods down** (critical)

### Access Prometheus (Advanced)

**URL:** `http://YOUR_SERVER_IP:30090`

Use Prometheus for:

- Custom queries (PromQL)
- Raw metrics exploration
- Alert rule testing

---

## 🔍 Verification & Troubleshooting

### Check Deployment Status

```bash
# SSH into your server
ssh -i /path/to/your-key.pem ubuntu@YOUR_SERVER_IP

# Check pods
microk8s kubectl get pods -n default -l app=school-portal

# Expected output:
# NAME                             READY   STATUS    RESTARTS   AGE
# school-portal-xxxxxxxx-xxxxx     1/1     Running   0          5m
# school-portal-xxxxxxxx-xxxxx     1/1     Running   0          5m
```

### View Logs

```bash
# Application logs
microk8s kubectl logs -n default -l app=school-portal --tail=50

# Follow logs in real-time
microk8s kubectl logs -n default -l app=school-portal -f
```

### Check Service

```bash
microk8s kubectl get svc -n default school-portal-service

# Expected:
# NAME                    TYPE       PORT(S)         AGE
# school-portal-service   NodePort   443:30443/TCP   5m
```

### Test from Server

```bash
# Test HTTPS endpoint
curl -k -I https://localhost:30443

# Should return: HTTP/1.1 200 OK
```

---

## 🐛 Common Issues & Solutions

### Issue: Can't access `https://IP:30443`

**Check:**

1. ✅ AWS Security Group allows port 30443
2. ✅ Pods are running (`kubectl get pods`)
3. ✅ Service is exposed (`kubectl get svc`)

**Test from server:**

```bash
curl -k https://localhost:30443
# If this works but external doesn't, it's a firewall issue
```

### Issue: Pods in CrashLoopBackOff

**Check logs:**

```bash
microk8s kubectl logs <pod-name> --tail=100
```

**Common causes:**

- Missing environment variables
- Incorrect certificate paths
- Port conflicts

**Solution:** Check the deployment configuration and redeploy

### Issue: Login fails / Azure AD error

**Verify:**

1. ✅ Azure AD has correct redirect URI: `https://YOUR_IP:30443`
2. ✅ `REACT_APP_REDIRECT_URI` in build matches Azure AD
3. ✅ Client ID and Tenant ID are correct

**Fix:** Rebuild with correct redirect URI (see Update section below)

### Issue: SSH locked out after deployment

**This shouldn't happen anymore!** The playbook now allows SSH before enabling firewall.

**If it does happen:** Use AWS Session Manager or recreate instance.

---

## 🔄 Update / Redeploy

### Update Application Code

```bash
# Re-run playbook (it will rebuild and redeploy)
ansible-playbook -i my-production.yml playbook-production.yml
```

### Change Redirect URI

Edit `my-production.yml`:

```yaml
vars:
  production_ip: NEW_IP # Change this
```

Then redeploy:

```bash
ansible-playbook -i my-production.yml playbook-production.yml
```

**Don't forget to update Azure AD with the new redirect URI!**

### Restart Pods

```bash
ssh ubuntu@YOUR_IP
microk8s kubectl rollout restart deployment school-portal -n default
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Check disk space
df -h

# Check memory
free -h

# Check pod resources
microk8s kubectl top pods -n default
```

### Health Checks

The app has built-in health endpoints:

- `http://localhost:3000/api/health` - Liveness probe
- `http://localhost:3000/api/health/ready` - Readiness probe

### Logs

```bash
# Application logs
microk8s kubectl logs -n default -l app=school-portal --tail=100

# System logs
sudo journalctl -u snap.microk8s.daemon-kubelite -f

# Docker logs (during build)
sudo journalctl -u docker -f
```

---

## 🌐 Migrate to Domain Name

When DNS is ready:

### 1. Point DNS to Server

```
A Record: portal.yourdomain.com → YOUR_SERVER_IP
```

### 2. Update Inventory

Edit `my-production.yml`:

```yaml
vars:
  use_ip: false # Change to false
  production_domain: portal.yourdomain.com # Your actual domain
```

### 3. Update Azure AD

Replace redirect URI:

- ❌ Remove: `https://YOUR_IP:30443`
- ✅ Add: `https://portal.yourdomain.com`

### 4. Redeploy

```bash
ansible-playbook -i my-production.yml playbook-production.yml
```

**This will:**

- Use Let's Encrypt for real SSL certificates (no more browser warnings!)
- Configure Ingress with your domain
- Expose on standard port 443

**Access at:** `https://portal.yourdomain.com`

---

## 🔒 Security Best Practices

1. ✅ **Keep SSH key secure** - Never commit to git
2. ✅ **Use strong passwords** - All credentials in `.env`
3. ✅ **Regular updates** - Run `apt update && apt upgrade`
4. ✅ **Monitor logs** - Check for suspicious activity
5. ✅ **Backup data** - Regular backups of important data
6. ✅ **Rotate secrets** - Change passwords periodically

---

## 📖 Additional Resources

- [Deployment Scenarios](DEPLOYMENT-SCENARIOS.md) - Compare deployment options
- [HTTPS with IP Guide](HTTPS-WITH-IP.md) - Detailed IP deployment guide
- [Playbook Reference](ansible/playbook-production.yml) - See what the playbook does

---

## 🆘 Getting Help

**If something goes wrong:**

1. **Check the logs** - Most issues show up in logs
2. **Verify configuration** - Double-check IPs, ports, credentials
3. **Test connectivity** - Make sure firewalls allow required ports
4. **Read error messages** - They usually tell you what's wrong!

**Common commands for debugging:**

```bash
# Check everything
microk8s kubectl get all -n default

# Describe pod (shows events and errors)
microk8s kubectl describe pod <pod-name> -n default

# Check recent events
microk8s kubectl get events -n default --sort-by='.lastTimestamp'

# Check firewall rules
sudo iptables -L -n -v

# Check if port is listening
sudo netstat -tlnp | grep 30443
```

---

## ✅ Quick Checklist

Before going live:

- [ ] Server meets minimum requirements (2 vCPU, 4GB RAM, 20GB disk)
- [ ] Security Group / Firewall allows ports 22, 80, 443, 30443
- [ ] `.env` file configured with all required variables
- [ ] Inventory file updated with correct IP and SSH key
- [ ] Deployment completed successfully (no errors)
- [ ] Pods are running (`1/1 Ready`)
- [ ] Can access app at `https://IP:30443`
- [ ] Azure AD redirect URI added
- [ ] Login works correctly
- [ ] Tested with different user roles
- [ ] Monitoring set up (optional but recommended)

**🎉 Congratulations! Your School Portal is live!**
