# 🚀 EC2 Deployment Checklist

Use this checklist to ensure a smooth deployment to your EC2 instance.

## ☑️ Pre-Deployment Checklist

### AWS Infrastructure

- [ ] EC2 instance running (Amazon Linux 2 or Ubuntu)
- [ ] EBS volume attached to EC2 instance
- [ ] S3 bucket created for backups
- [ ] IAM role created with CloudWatch + S3 permissions
- [ ] IAM role attached to EC2 instance
- [ ] Security Group configured:
  - [ ] Port 80 (HTTP) - Monitor App
  - [ ] Port 3000 (Grafana)
  - [ ] Port 9090 (Prometheus)
  - [ ] Port 22 (SSH for management)

### Local Preparation

- [ ] All files present in `monitor-app` directory
- [ ] Reviewed `QUICKSTART-EC2.md`
- [ ] Reviewed `DEPLOYMENT-EC2.md`
- [ ] Code ready to upload/clone to EC2

---

## 📦 Deployment Steps

### 1️⃣ EC2 Instance Setup

```bash
# SSH to EC2
ssh -i your-key.pem ec2-user@<ec2-public-ip>

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Log out and back in for group changes
exit
ssh -i your-key.pem ec2-user@<ec2-public-ip>
```

**Status**: [ ] Complete

---

### 2️⃣ EBS Volume Setup

```bash
# List block devices
lsblk

# Format EBS volume (ONLY FIRST TIME!)
sudo mkfs -t ext4 /dev/xvdf

# Create mount point
sudo mkdir -p /mnt/ebs

# Mount volume
sudo mount /dev/xvdf /mnt/ebs

# Auto-mount on reboot
echo '/dev/xvdf /mnt/ebs ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab

# Verify mount
df -h | grep ebs

# Create data directories
sudo mkdir -p /mnt/ebs/{prometheus,grafana,backups}

# Set ownership (critical for permissions!)
sudo chown -R 65534:65534 /mnt/ebs/prometheus
sudo chown -R 472:472 /mnt/ebs/grafana
sudo chmod -R 755 /mnt/ebs
```

**Status**: [ ] Complete

---

### 3️⃣ Upload Application

Choose one method:

#### Option A: Git Clone

```bash
cd /home/ec2-user
git clone <your-repo-url>
cd monitor-app
```

#### Option B: SCP Upload

```bash
# From your local machine
scp -i your-key.pem -r monitor-app ec2-user@<ec2-public-ip>:/home/ec2-user/
```

#### Option C: Archive Upload

```bash
# Local: Create archive
tar -czf monitor-app.tar.gz monitor-app/

# Local: Upload
scp -i your-key.pem monitor-app.tar.gz ec2-user@<ec2-public-ip>:/home/ec2-user/

# EC2: Extract
cd /home/ec2-user
tar -xzf monitor-app.tar.gz
```

**Status**: [ ] Complete

---

### 4️⃣ Configure Environment

```bash
cd /home/ec2-user/monitor-app

# Copy environment template
cp .env.production.example .env

# Edit environment variables
nano .env
```

**Required values in `.env`:**

```bash
AWS_REGION=us-east-1              # Your AWS region
S3_BUCKET=your-backup-bucket      # Your S3 bucket name
GRAFANA_ADMIN_PASSWORD=SecurePass123!  # Change this!
```

**Status**: [ ] Complete

---

### 5️⃣ Deploy Stack

```bash
cd /home/ec2-user/monitor-app

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

**Expected containers:**

- [ ] cloudwatch-exporter
- [ ] prometheus
- [ ] grafana
- [ ] monitor-app
- [ ] node-exporter
- [ ] cadvisor

**Status**: [ ] Complete

---

### 6️⃣ Verify Services

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana
curl http://localhost:3000/api/health

# Check Monitor App
curl http://localhost:3001/health

# Check CloudWatch Exporter
curl http://localhost:9106/metrics
```

**Access from browser:**

- [ ] Monitor App: `http://<ec2-public-ip>`
- [ ] Grafana: `http://<ec2-public-ip>:3000`
- [ ] Prometheus: `http://<ec2-public-ip>:9090`

**Status**: [ ] Complete

---

### 7️⃣ Configure S3 Backups

```bash
cd /home/ec2-user/monitor-app

# Make script executable
chmod +x backup.sh

# Test backup manually
./backup.sh

# Verify S3 upload
aws s3 ls s3://your-backup-bucket/

# Add to crontab (daily at 2 AM)
crontab -e
```

**Add this line to crontab:**

```
0 2 * * * /home/ec2-user/monitor-app/backup.sh >> /var/log/backup.log 2>&1
```

**Status**: [ ] Complete

---

### 8️⃣ Verify CloudWatch Integration

```bash
# Check CloudWatch metrics in Prometheus
curl 'http://localhost:9090/api/v1/query?query=aws_ec2_cpuutilization_average'

# Should see metrics for your EC2 instances
```

In Grafana:

- [ ] Open Infrastructure Overview dashboard
- [ ] Verify EC2 metrics appear
- [ ] Verify EBS metrics appear
- [ ] Verify S3 metrics appear

**Status**: [ ] Complete

---

### 9️⃣ Configure Grafana

```bash
# Access Grafana
open http://<ec2-public-ip>:3000
```

**Steps:**

1. [ ] Login with: `admin` / (password from .env)
2. [ ] Change admin password when prompted
3. [ ] Verify Prometheus datasource is configured
4. [ ] Open pre-configured dashboards:
   - [ ] Infrastructure Overview
   - [ ] Container Monitoring
   - [ ] Portal CECRE Monitoring
5. [ ] Verify data is flowing

**Status**: [ ] Complete

---

### 🔟 Final Verification

#### All Services Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:

```
NAMES                  STATUS              PORTS
monitor-app            Up X minutes        0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp
grafana                Up X minutes        0.0.0.0:3000->3000/tcp
prometheus             Up X minutes        0.0.0.0:9090->9090/tcp
cloudwatch-exporter    Up X minutes        0.0.0.0:9106->9106/tcp
node-exporter          Up X minutes        0.0.0.0:9100->9100/tcp
cadvisor               Up X minutes        0.0.0.0:8080->8080/tcp
```

#### Prometheus Targets

```bash
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

All should show `"health": "up"`

#### Portal Monitoring

- [ ] Portal CECRE is being monitored
- [ ] Response time data available
- [ ] Status checks working

#### Data Persistence

```bash
# Check EBS usage
df -h /mnt/ebs

# Check Prometheus data
sudo ls -lh /mnt/ebs/prometheus/

# Check Grafana data
sudo ls -lh /mnt/ebs/grafana/
```

#### Backups

```bash
# Check S3 backups
aws s3 ls s3://your-backup-bucket/ | grep monitoring-backup

# Check cron
crontab -l | grep backup
```

**Status**: [ ] Complete

---

## 🎯 Post-Deployment Tasks

### Security Hardening

- [ ] Change all default passwords
- [ ] Restrict Security Group rules to specific IPs
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Configure firewall (ufw/iptables)
- [ ] Enable CloudWatch Alarms for critical metrics
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Enable EBS encryption for new volumes
- [ ] Enable S3 bucket versioning and encryption

### Monitoring Setup

- [ ] Configure alert notification channels in Grafana
- [ ] Set up email/Slack alerts for critical issues
- [ ] Create custom dashboards for your needs
- [ ] Configure retention policies
- [ ] Test alert rules

### Documentation

- [ ] Document your specific AWS resources
- [ ] Note EC2 instance ID, EBS volume ID, S3 bucket name
- [ ] Save Grafana admin credentials securely
- [ ] Document custom configurations

---

## 🆘 Troubleshooting

### Container Won't Start

```bash
docker-compose -f docker-compose.production.yml logs <container-name>
```

### Permission Denied Errors

```bash
# Fix Prometheus permissions
sudo chown -R 65534:65534 /mnt/ebs/prometheus

# Fix Grafana permissions
sudo chown -R 472:472 /mnt/ebs/grafana
```

### CloudWatch Metrics Not Appearing

```bash
# Check IAM permissions
aws sts get-caller-identity

# Test CloudWatch access
aws cloudwatch list-metrics --namespace AWS/EC2

# Check exporter logs
docker logs cloudwatch-exporter
```

### Backup Failing

```bash
# Test S3 access
aws s3 ls s3://your-backup-bucket

# Run backup manually with verbose output
bash -x ./backup.sh
```

---

## 📊 Success Criteria

✅ All 6 containers running  
✅ Prometheus scraping all targets  
✅ Grafana displaying dashboards  
✅ CloudWatch metrics visible  
✅ Portal CECRE being monitored  
✅ S3 backups configured  
✅ Data persisting on EBS  
✅ Alerts configured

---

## 📞 Need Help?

- **Quick Reference**: `QUICKSTART-EC2.md`
- **Full Guide**: `DEPLOYMENT-EC2.md`
- **Project Info**: `README.md`
- **Deployment Status**: `EC2-DEPLOYMENT-READY.md`

---

**Deployment Date**: **\*\***\_\_\_**\*\***  
**EC2 Instance ID**: **\*\***\_\_\_**\*\***  
**EBS Volume ID**: **\*\***\_\_\_**\*\***  
**S3 Bucket**: **\*\***\_\_\_**\*\***  
**Deployed By**: **\*\***\_\_\_**\*\***

---

🎉 **Congratulations! Your monitoring stack is deployed and operational!**
