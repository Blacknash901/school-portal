# EC2 Deployment Quick Reference

## 📋 Overview

This document provides a quick reference for deploying the monitoring stack to EC2 with CloudWatch integration.

## 🚀 Quick Deployment Steps

### 1. Prepare EC2 Instance

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Mount EBS Volume

```bash
# Check attached volumes
lsblk

# Format (only first time)
sudo mkfs -t ext4 /dev/xvdf

# Create mount point
sudo mkdir -p /mnt/ebs

# Mount volume
sudo mount /dev/xvdf /mnt/ebs

# Auto-mount on reboot
echo '/dev/xvdf /mnt/ebs ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab

# Create data directories
sudo mkdir -p /mnt/ebs/{prometheus,grafana,backups}
sudo chown -R 65534:65534 /mnt/ebs/prometheus
sudo chown -R 472:472 /mnt/ebs/grafana
```

### 3. Deploy Application

```bash
# Clone/upload your code
cd /home/ec2-user
# Upload monitor-app directory here

# Configure environment
cd monitor-app
cp .env.production.example .env
nano .env  # Update AWS_REGION, S3_BUCKET, passwords

# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

### 4. Setup S3 Backups

```bash
# Make backup script executable
chmod +x backup.sh

# Test backup
./backup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ec2-user/monitor-app/backup.sh >> /var/log/backup.log 2>&1
```

### 5. Configure IAM Permissions

Attach IAM role to EC2 instance with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["cloudwatch:GetMetricStatistics", "cloudwatch:ListMetrics"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::monitoring-backups",
        "arn:aws:s3:::monitoring-backups/*"
      ]
    }
  ]
}
```

## 🔍 Access URLs

After deployment, access:

- **Monitor App**: `http://<ec2-public-ip>`
- **Grafana**: `http://<ec2-public-ip>:3000` (admin/admin123)
- **Prometheus**: `http://<ec2-public-ip>:9090`

## 📊 Key Files

| File                             | Purpose                         |
| -------------------------------- | ------------------------------- |
| `docker-compose.production.yml`  | Production stack configuration  |
| `cloudwatch-exporter-config.yml` | CloudWatch metrics to scrape    |
| `prometheus-ec2.yml`             | Prometheus scrape configuration |
| `prometheus-alerts.yml`          | Alert rules                     |
| `backup.sh`                      | S3 backup script                |
| `grafana-provisioning/`          | Auto-configured dashboards      |

## 🛠️ Common Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop all
docker-compose -f docker-compose.production.yml down

# Update configuration
docker-compose -f docker-compose.production.yml up -d --force-recreate

# Check container status
docker ps

# View specific service logs
docker logs prometheus
docker logs grafana
docker logs monitor-app
```

## 🔧 Troubleshooting

### CloudWatch Exporter Not Scraping

```bash
# Check exporter logs
docker logs cloudwatch-exporter

# Verify IAM permissions
aws sts get-caller-identity

# Test CloudWatch access
aws cloudwatch list-metrics --namespace AWS/EC2
```

### Prometheus Not Storing Data

```bash
# Check permissions
ls -la /mnt/ebs/prometheus

# Fix permissions
sudo chown -R 65534:65534 /mnt/ebs/prometheus
```

### Backup Failing

```bash
# Test manually
./backup.sh

# Check S3 access
aws s3 ls s3://monitoring-backups

# View backup logs
tail -f /var/log/backup.log
```

## 📈 Monitoring Checklist

- [ ] EC2 instance running
- [ ] EBS volume mounted to `/mnt/ebs`
- [ ] All containers running (`docker ps`)
- [ ] Prometheus scraping targets (`http://<ip>:9090/targets`)
- [ ] Grafana accessible with dashboards
- [ ] CloudWatch metrics visible in Prometheus
- [ ] S3 backups configured and running
- [ ] Portal CECRE monitoring active

## 🔒 Security Notes

1. **Change default passwords** in `.env`
2. **Configure Security Group** to allow only necessary ports
3. **Enable HTTPS** using reverse proxy (nginx/caddy)
4. **Restrict Grafana access** to specific IPs
5. **Enable IAM role** instead of access keys
6. **Encrypt EBS volume** at rest

## 📚 Full Documentation

See `DEPLOYMENT-EC2.md` for complete deployment guide with detailed explanations.

---

**Last Updated**: $(date)
**Version**: 1.0.0
