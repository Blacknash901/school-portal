# CECRE Monitoring - EC2 Deployment Guide

## Overview

Deploy the CECRE monitoring application on an existing EC2 instance with Docker Compose. The application will:

- Monitor portal.cecre.net
- Scrape metrics from the existing infrastructure via CloudWatch
- Display Prometheus and Grafana dashboards
- Store data on attached EBS volumes
- Backup to existing S3 bucket

## Architecture

```
┌─────────────────────────────────────────┐
│         EC2 Instance                    │
│  ┌───────────────────────────────────┐  │
│  │  Docker Compose Stack             │  │
│  │  ├─ Monitor App (React + API)    │  │
│  │  ├─ Prometheus                    │  │
│  │  ├─ Grafana                       │  │
│  │  └─ CloudWatch Exporter           │  │
│  └───────────────────────────────────┘  │
│         │              │                 │
│    ┌────▼────┐    ┌───▼────┐           │
│    │   EBS   │    │   S3   │           │
│    │ Volume  │    │ Backup │           │
│    └─────────┘    └────────┘           │
└─────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────┐
  │   CloudWatch     │
  │  (Infrastructure)│
  └──────────────────┘
```

## Prerequisites

- Existing EC2 instance (Ubuntu/Amazon Linux 2)
- Docker and Docker Compose installed
- EBS volume attached (already configured)
- S3 bucket access (already configured)
- AWS credentials configured on EC2 instance
- Ports 80, 3000, 3001, 9090 open in security group

---

## Step 1: Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

---

## Step 2: Install Docker (if not already installed)

### For Amazon Linux 2

```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

### For Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ubuntu

# Log out and back in
exit
```

---

## Step 3: Prepare the Application

### Clone/Upload the Application

```bash
# Option A: Clone from Git
git clone YOUR_REPO_URL /home/ec2-user/monitor-app
cd /home/ec2-user/monitor-app

# Option B: Upload via SCP
# From your local machine:
scp -i your-key.pem -r ./monitor-app ec2-user@YOUR_EC2_IP:/home/ec2-user/
```

### Configure Environment Variables

```bash
cd /home/ec2-user/monitor-app

# Create .env file
cat > .env << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:3001
PORT=3001

# Prometheus & Grafana
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
GRAFANA_API_KEY=

# AWS Configuration
AWS_REGION=us-east-1
AWS_DEFAULT_REGION=us-east-1

# S3 Backup Configuration (from existing infrastructure)
S3_BUCKET=your-existing-s3-bucket-name

# CloudWatch Configuration
CLOUDWATCH_NAMESPACE=YourInfrastructure/Metrics
CLOUDWATCH_REGION=us-east-1

# Node Environment
NODE_ENV=production
EOF
```

---

## Step 4: Configure EBS Volume Mount

### Check Attached EBS Volume

```bash
# List available volumes
lsblk

# Expected output showing your EBS volume (e.g., /dev/xvdf)
```

### Mount EBS Volume for Data Persistence

```bash
# Create mount points
sudo mkdir -p /mnt/ebs/prometheus
sudo mkdir -p /mnt/ebs/grafana
sudo mkdir -p /mnt/ebs/backups

# If volume is new, format it (ONLY IF NEW - THIS WILL ERASE DATA!)
# sudo mkfs -t ext4 /dev/xvdf

# Mount the volume
sudo mount /dev/xvdf /mnt/ebs

# Set permissions
sudo chown -R 65534:65534 /mnt/ebs/prometheus  # nobody:nogroup for Prometheus
sudo chown -R 472:472 /mnt/ebs/grafana         # grafana user
sudo chmod -R 755 /mnt/ebs

# Add to /etc/fstab for automatic mounting on reboot
echo '/dev/xvdf /mnt/ebs ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab

# Verify mount
df -h /mnt/ebs
```

---

## Step 5: Update Docker Compose for EC2

Create `docker-compose.production.yml`:

```yaml
version: "3.8"

services:
  # CloudWatch Exporter - scrapes metrics from CloudWatch
  cloudwatch-exporter:
    image: prom/cloudwatch-exporter:latest
    container_name: cloudwatch-exporter
    ports:
      - "9106:9106"
    volumes:
      - ./cloudwatch-exporter-config.yml:/config/config.yml
    command:
      - "--config.file=/config/config.yml"
    environment:
      - AWS_REGION=${AWS_REGION}
    restart: unless-stopped
    networks:
      - monitoring

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus-ec2.yml:/etc/prometheus/prometheus.yml
      - /mnt/ebs/prometheus:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
      - "--web.enable-lifecycle"
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - cloudwatch-exporter

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin123}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-clock-panel
      - GF_SERVER_ROOT_URL=http://localhost:3000
    volumes:
      - /mnt/ebs/grafana:/var/lib/grafana
      - ./grafana-provisioning:/etc/grafana/provisioning
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  # Monitor App
  monitor-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: monitor-app
    ports:
      - "80:80"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - PROMETHEUS_URL=http://prometheus:9090
      - GRAFANA_URL=http://grafana:3000
      - GRAFANA_API_KEY=${GRAFANA_API_KEY}
      - AWS_REGION=${AWS_REGION}
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus
      - grafana

  # Nginx reverse proxy (optional - for SSL)
  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - monitor-app

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
```

---

## Step 6: Configure CloudWatch Exporter

Create `cloudwatch-exporter-config.yml`:

```yaml
---
region: us-east-1
period_seconds: 60
range_seconds: 300

metrics:
  # EC2 Instance Metrics
  - aws_namespace: AWS/EC2
    aws_metric_name: CPUUtilization
    aws_dimensions:
      - InstanceId
    aws_statistics:
      - Average
      - Maximum

  - aws_namespace: AWS/EC2
    aws_metric_name: NetworkIn
    aws_dimensions:
      - InstanceId
    aws_statistics:
      - Sum

  - aws_namespace: AWS/EC2
    aws_metric_name: NetworkOut
    aws_dimensions:
      - InstanceId
    aws_statistics:
      - Sum

  - aws_namespace: AWS/EC2
    aws_metric_name: DiskReadBytes
    aws_dimensions:
      - InstanceId
    aws_statistics:
      - Sum

  - aws_namespace: AWS/EC2
    aws_metric_name: DiskWriteBytes
    aws_dimensions:
      - InstanceId
    aws_statistics:
      - Sum

  # EBS Volume Metrics
  - aws_namespace: AWS/EBS
    aws_metric_name: VolumeReadBytes
    aws_dimensions:
      - VolumeId
    aws_statistics:
      - Sum

  - aws_namespace: AWS/EBS
    aws_metric_name: VolumeWriteBytes
    aws_dimensions:
      - VolumeId
    aws_statistics:
      - Sum

  # S3 Bucket Metrics (if enabled)
  - aws_namespace: AWS/S3
    aws_metric_name: BucketSizeBytes
    aws_dimensions:
      - BucketName
      - StorageType
    aws_statistics:
      - Average

  # Custom Application Metrics (from your infrastructure project)
  - aws_namespace: YourInfrastructure/Metrics
    aws_metric_name: ApplicationHealth
    aws_statistics:
      - Average
```

---

## Step 7: Configure Prometheus for EC2

Create `prometheus-ec2.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: "cecre-ec2"
    environment: "production"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  # Prometheus self-monitoring
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # CloudWatch Exporter
  - job_name: "cloudwatch"
    static_configs:
      - targets: ["cloudwatch-exporter:9106"]

  # Monitor App
  - job_name: "monitor-app"
    static_configs:
      - targets: ["monitor-app:3001"]
    metrics_path: "/metrics"

  # Portal CECRE monitoring
  - job_name: "portal-cecre"
    metrics_path: "/probe"
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://portal.cecre.net
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115 # If using blackbox exporter

  # Node Exporter (if installed on EC2)
  - job_name: "node"
    static_configs:
      - targets: ["localhost:9100"]
```

---

## Step 8: Setup Grafana Provisioning

Create directory structure:

```bash
mkdir -p grafana-provisioning/datasources
mkdir -p grafana-provisioning/dashboards
```

Create `grafana-provisioning/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: CloudWatch
    type: cloudwatch
    jsonData:
      authType: default
      defaultRegion: us-east-1
```

---

## Step 9: Configure S3 Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Configuration
S3_BUCKET="${S3_BUCKET:-your-bucket-name}"
BACKUP_DIR="/mnt/ebs/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Prometheus data
echo "Backing up Prometheus data..."
tar czf $BACKUP_DIR/prometheus-$TIMESTAMP.tar.gz -C /mnt/ebs/prometheus .
aws s3 cp $BACKUP_DIR/prometheus-$TIMESTAMP.tar.gz s3://$S3_BUCKET/monitoring/prometheus/

# Backup Grafana data
echo "Backing up Grafana data..."
tar czf $BACKUP_DIR/grafana-$TIMESTAMP.tar.gz -C /mnt/ebs/grafana .
aws s3 cp $BACKUP_DIR/grafana-$TIMESTAMP.tar.gz s3://$S3_BUCKET/monitoring/grafana/

# Cleanup old local backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Cleanup old S3 backups (keep last 30 days)
aws s3 ls s3://$S3_BUCKET/monitoring/prometheus/ | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk '{print $4}')
    if [[ $fileName != "" ]]; then
      aws s3 rm s3://$S3_BUCKET/monitoring/prometheus/$fileName
    fi
  fi
done

echo "Backup completed: $TIMESTAMP"
```

Make executable and add to cron:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/ec2-user/monitor-app/backup.sh >> /var/log/monitor-backup.log 2>&1
```

---

## Step 10: Deploy the Application

### Build and Start

```bash
cd /home/ec2-user/monitor-app

# Build the monitor app image
docker-compose -f docker-compose.production.yml build

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Verify Services

```bash
# Check if all containers are running
docker ps

# Test Prometheus
curl http://localhost:9090/-/healthy

# Test Grafana
curl http://localhost:3000/api/health

# Test Monitor App
curl http://localhost:3001/health

# Test CloudWatch Exporter
curl http://localhost:9106/metrics
```

---

## Step 11: Configure Grafana

### Access Grafana

```
http://YOUR_EC2_IP:3000
```

Login: `admin` / `admin123` (change this!)

### Generate API Key

1. Go to Configuration → API Keys
2. Create new key (Viewer role)
3. Copy the key

### Update Environment Variable

```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Update .env file
echo "GRAFANA_API_KEY=your-generated-key" >> .env

# Restart
docker-compose -f docker-compose.production.yml up -d
```

---

## Step 12: Access the Application

### Direct Access

```
http://YOUR_EC2_IP
```

### Setup Domain (Optional)

If you have a domain pointing to your EC2:

1. Update security group to allow HTTPS (443)
2. Install certbot for SSL
3. Configure nginx reverse proxy

---

## Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f monitor-app
docker-compose -f docker-compose.production.yml logs -f prometheus
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart monitor-app
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Manual Backup

```bash
./backup.sh
```

### Restore from Backup

```bash
# Download from S3
aws s3 cp s3://$S3_BUCKET/monitoring/prometheus/prometheus-TIMESTAMP.tar.gz .

# Stop Prometheus
docker-compose -f docker-compose.production.yml stop prometheus

# Restore data
sudo tar xzf prometheus-TIMESTAMP.tar.gz -C /mnt/ebs/prometheus/

# Start Prometheus
docker-compose -f docker-compose.production.yml start prometheus
```

---

## Monitoring

### Check Resource Usage

```bash
# Docker stats
docker stats

# Disk usage
df -h /mnt/ebs

# Check EBS metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/EBS \
  --metric-name VolumeReadBytes \
  --dimensions Name=VolumeId,Value=vol-XXXXX \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check Docker daemon
sudo systemctl status docker
```

### Cannot Access from Browser

```bash
# Check security group allows ports 80, 3000, 3001, 9090
# Check if services are listening
sudo netstat -tlnp | grep -E ':(80|3000|3001|9090)'
```

### CloudWatch Exporter Not Working

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check IAM permissions for CloudWatch
aws cloudwatch list-metrics --namespace AWS/EC2
```

### Data Not Persisting

```bash
# Check EBS mount
df -h /mnt/ebs

# Check permissions
ls -la /mnt/ebs/
```

---

## Security

### Firewall Rules

```bash
# Only allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Change Default Passwords

```bash
# Update .env
GRAFANA_ADMIN_PASSWORD=your-secure-password

# Restart Grafana
docker-compose -f docker-compose.production.yml restart grafana
```

---

## Complete Setup Script

Save as `setup-ec2.sh`:

```bash
#!/bin/bash
set -e

echo "Setting up CECRE Monitoring on EC2..."

# Update .env with your values
read -p "Enter S3 bucket name: " S3_BUCKET
read -p "Enter AWS region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

cat > .env << EOF
VITE_API_URL=http://localhost:3001
PORT=3001
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
GRAFANA_API_KEY=
AWS_REGION=$AWS_REGION
S3_BUCKET=$S3_BUCKET
NODE_ENV=production
EOF

# Build and start
docker-compose -f docker-compose.production.yml up -d --build

echo "✅ Setup complete!"
echo "Access the application at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Grafana: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "Prometheus: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):9090"
```

---

**Deployment Complete!** Your monitoring application is now running on EC2 with CloudWatch integration.
