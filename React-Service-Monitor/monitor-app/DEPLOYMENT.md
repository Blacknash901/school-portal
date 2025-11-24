# CECRE Monitoring - Deployment Guide

## Complete Deployment Instructions

### Prerequisites

1. **Kubernetes Cluster** (EKS recommended)
2. **kubectl** configured to access your cluster
3. **AWS CLI** configured with appropriate credentials
4. **Docker** installed (for building images)
5. **Node.js 18+** for local development

---

## Step 1: Prepare Infrastructure

### Create S3 Bucket for Backups

```bash
# Create S3 bucket for backups
aws s3 mb s3://cecre-monitoring-backup --region us-east-1

# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket cecre-monitoring-backup \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket cecre-monitoring-backup \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### Create IAM Role for Service Account

Create a file `iam-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::cecre-monitoring-backup",
        "arn:aws:s3:::cecre-monitoring-backup/*"
      ]
    }
  ]
}
```

Create the policy and associate with service account:

```bash
# Create IAM policy
aws iam create-policy \
  --policy-name CecreMonitoringBackupPolicy \
  --policy-document file://iam-policy.json

# Note the policy ARN from output

# For EKS - Create service account with IAM role
eksctl create iamserviceaccount \
  --name backup-sa \
  --namespace monitoring \
  --cluster YOUR_CLUSTER_NAME \
  --attach-policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/CecreMonitoringBackupPolicy \
  --approve \
  --override-existing-serviceaccounts
```

### Install EBS CSI Driver (if not already installed)

```bash
# Add the AWS EBS CSI Driver
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.25"

# Verify installation
kubectl get pods -n kube-system | grep ebs-csi
```

---

## Step 2: Build and Push Docker Image

### Option A: Build Locally

```bash
# Build the image
docker build -t YOUR_REGISTRY/cecre-monitor-app:latest .

# Test locally (optional)
docker run -p 3001:3001 YOUR_REGISTRY/cecre-monitor-app:latest

# Push to registry
docker push YOUR_REGISTRY/cecre-monitor-app:latest
```

### Option B: Build on AWS ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name cecre-monitor-app

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cecre-monitor-app:latest .

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cecre-monitor-app:latest
```

---

## Step 3: Update Configuration Files

### 1. Update S3 Backup Configuration

Edit `k8s/storage-backup.yaml`:

```yaml
# Line 73-75: Update bucket name
data:
  s3_bucket: "YOUR-ACTUAL-BUCKET-NAME" # Change this

# Line 82-83: Update IAM role ARN
annotations:
  eks.amazonaws.com/role-arn: arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_ROLE_NAME
```

### 2. Update Monitor App Image

Edit `k8s/monitor-app-deployment.yaml`:

```yaml
# Line 32: Update image
containers:
  - name: monitor-app
    image: YOUR_REGISTRY/cecre-monitor-app:latest # Change this
```

### 3. Change Grafana Admin Password

Edit `k8s/grafana-deployment.yaml`:

```yaml
# Line 92-93: Change password
stringData:
  password: "YOUR_SECURE_PASSWORD" # Change from default!
```

### 4. Update AWS Region (if needed)

Edit `k8s/storage-backup.yaml`:

```yaml
# Line 59: Update region
- name: AWS_REGION
  value: "YOUR_REGION" # e.g., us-west-2
```

---

## Step 4: Deploy to Kubernetes

### Option A: Use Deployment Script (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Option B: Manual Deployment

```bash
# 1. Create namespace and deploy Prometheus configuration
kubectl apply -f k8s/prometheus-config.yaml

# 2. Deploy Prometheus
kubectl apply -f k8s/prometheus-deployment.yaml

# 3. Wait for Prometheus to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s

# 4. Deploy kube-state-metrics
kubectl apply -f k8s/kube-state-metrics.yaml

# 5. Deploy Grafana
kubectl apply -f k8s/grafana-deployment.yaml
kubectl apply -f k8s/grafana-dashboard.yaml

# 6. Wait for Grafana to be ready
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

# 7. Deploy backup configuration
kubectl apply -f k8s/storage-backup.yaml

# 8. Deploy monitor application
kubectl apply -f k8s/monitor-app-deployment.yaml

# 9. Wait for monitor app to be ready
kubectl wait --for=condition=ready pod -l app=monitor-app -n monitoring --timeout=300s
```

---

## Step 5: Verify Deployment

### Check Pod Status

```bash
# View all pods in monitoring namespace
kubectl get pods -n monitoring

# Expected output:
# NAME                                  READY   STATUS    RESTARTS   AGE
# prometheus-xxxxxxxxxx-xxxxx           1/1     Running   0          5m
# grafana-xxxxxxxxxx-xxxxx              1/1     Running   0          4m
# kube-state-metrics-xxxxxxxxxx-xxxxx   1/1     Running   0          4m
# monitor-app-xxxxxxxxxx-xxxxx          1/1     Running   0          3m
# monitor-app-xxxxxxxxxx-xxxxx          1/1     Running   0          3m
```

### Check Services

```bash
kubectl get svc -n monitoring

# Expected services:
# prometheus, grafana, monitor-app, kube-state-metrics
```

### Check Persistent Volumes

```bash
kubectl get pvc -n monitoring

# Should show:
# prometheus-storage   Bound
# grafana-storage      Bound
```

### View Logs

```bash
# Monitor app logs
kubectl logs -n monitoring -l app=monitor-app --tail=50

# Prometheus logs
kubectl logs -n monitoring -l app=prometheus --tail=50

# Grafana logs
kubectl logs -n monitoring -l app=grafana --tail=50
```

---

## Step 6: Configure Grafana

### Access Grafana

```bash
# Port forward to access Grafana UI
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

### Login and Generate API Key

1. **Open browser**: http://localhost:3000
2. **Login**:
   - Username: `admin`
   - Password: (the one you set in step 3)
3. **Generate API Key**:
   - Go to: Configuration → API Keys
   - Click: "New API Key"
   - Name: `monitor-app`
   - Role: `Viewer`
   - Copy the generated key

### Update Kubernetes Secret

```bash
# Create/update the secret with your API key
kubectl create secret generic grafana-api-key \
  --from-literal=api-key=YOUR_GRAFANA_API_KEY \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Restart Monitor App

```bash
# Restart to pick up the new API key
kubectl rollout restart deployment/monitor-app -n monitoring

# Wait for rollout to complete
kubectl rollout status deployment/monitor-app -n monitoring
```

---

## Step 7: Access the Application

### Get LoadBalancer URL

```bash
# Get the external URL
kubectl get svc monitor-app -n monitoring

# Look for EXTERNAL-IP column
# It might take 2-3 minutes to provision
```

### Access via LoadBalancer

```bash
# Once you have the EXTERNAL-IP:
http://YOUR_LOADBALANCER_URL
```

### Alternative: Port Forwarding

```bash
# For testing or if LoadBalancer is not available
kubectl port-forward -n monitoring svc/monitor-app 8080:80

# Access at:
http://localhost:8080
```

---

## Post-Deployment Configuration

### Verify Metrics Collection

```bash
# Port forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Open http://localhost:9090
# Check Status → Targets to see all scrape targets
```

### Test Backup Job Manually

```bash
# Create a test job from the CronJob
kubectl create job --from=cronjob/backup-to-s3 test-backup -n monitoring

# Watch the job
kubectl get jobs -n monitoring -w

# Check logs
kubectl logs -n monitoring job/test-backup

# Verify in S3
aws s3 ls s3://cecre-monitoring-backup/prometheus/
aws s3 ls s3://cecre-monitoring-backup/grafana/
```

### Configure Alerts (Optional)

To receive alert notifications via email/Slack/etc., you need to configure Alertmanager:

1. Create `alertmanager-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'email'
    receivers:
      - name: 'email'
        email_configs:
          - to: 'your-email@example.com'
            from: 'alerts@example.com'
            smarthost: 'smtp.gmail.com:587'
            auth_username: 'your-email@example.com'
            auth_password: 'your-app-password'
```

2. Apply and update Prometheus to use Alertmanager

---

## Monitoring and Maintenance

### Monitor Resource Usage

```bash
# CPU and Memory usage of pods
kubectl top pods -n monitoring

# Node resource usage
kubectl top nodes

# Persistent volume usage
kubectl exec -n monitoring deploy/prometheus -- df -h /prometheus
kubectl exec -n monitoring deploy/grafana -- df -h /var/lib/grafana
```

### Scale the Application

```bash
# Scale monitor-app replicas
kubectl scale deployment/monitor-app -n monitoring --replicas=3

# Verify
kubectl get pods -n monitoring -l app=monitor-app
```

### Update the Application

```bash
# Build new image with new tag
docker build -t YOUR_REGISTRY/cecre-monitor-app:v1.1.0 .
docker push YOUR_REGISTRY/cecre-monitor-app:v1.1.0

# Update deployment
kubectl set image deployment/monitor-app \
  monitor-app=YOUR_REGISTRY/cecre-monitor-app:v1.1.0 \
  -n monitoring

# Watch rollout
kubectl rollout status deployment/monitor-app -n monitoring

# Rollback if needed
kubectl rollout undo deployment/monitor-app -n monitoring
```

### Backup and Restore

#### Manual Backup

```bash
# Backup Prometheus data
kubectl exec -n monitoring deploy/prometheus -- tar czf /tmp/prom-backup.tar.gz -C /prometheus .
kubectl cp monitoring/$(kubectl get pod -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}'):/tmp/prom-backup.tar.gz ./prom-backup.tar.gz

# Backup Grafana data
kubectl exec -n monitoring deploy/grafana -- tar czf /tmp/grafana-backup.tar.gz -C /var/lib/grafana .
kubectl cp monitoring/$(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}'):/tmp/grafana-backup.tar.gz ./grafana-backup.tar.gz
```

#### Restore from Backup

```bash
# Download from S3
aws s3 cp s3://cecre-monitoring-backup/prometheus/prometheus-backup-20231123.tar.gz .

# Scale down Prometheus
kubectl scale deployment/prometheus -n monitoring --replicas=0

# Wait for pod to terminate
kubectl wait --for=delete pod -l app=prometheus -n monitoring --timeout=60s

# Scale back up
kubectl scale deployment/prometheus -n monitoring --replicas=1

# Wait for new pod
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s

# Copy backup to pod
POD_NAME=$(kubectl get pod -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
kubectl cp ./prometheus-backup-20231123.tar.gz monitoring/$POD_NAME:/tmp/

# Extract in pod
kubectl exec -n monitoring $POD_NAME -- tar xzf /tmp/prometheus-backup-20231123.tar.gz -C /prometheus

# Restart to reload data
kubectl rollout restart deployment/prometheus -n monitoring
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod POD_NAME -n monitoring

# Check logs
kubectl logs POD_NAME -n monitoring

# Common issues:
# - Image pull errors: Check image name and registry credentials
# - Resource constraints: Check if cluster has enough resources
# - Config errors: Check ConfigMap syntax
```

### PVC Not Binding

```bash
# Check PVC status
kubectl describe pvc -n monitoring

# Check storage class
kubectl get sc

# Verify EBS CSI driver is running
kubectl get pods -n kube-system | grep ebs-csi

# Check events
kubectl get events -n monitoring --sort-by='.lastTimestamp'
```

### Cannot Access Prometheus/Grafana from Monitor App

```bash
# Check service endpoints
kubectl get endpoints -n monitoring

# Test connectivity from monitor-app pod
kubectl exec -n monitoring deploy/monitor-app -- curl http://prometheus:9090/api/v1/status/config
kubectl exec -n monitoring deploy/monitor-app -- curl http://grafana:3000/api/health

# Check network policies (if any)
kubectl get networkpolicies -n monitoring
```

### High Memory Usage

```bash
# Check current usage
kubectl top pods -n monitoring

# Increase Prometheus resources if needed
kubectl edit deployment prometheus -n monitoring

# Update:
resources:
  requests:
    memory: 4Gi
  limits:
    memory: 8Gi
```

### Backup Job Failing

```bash
# Check CronJob status
kubectl get cronjobs -n monitoring

# View last job
kubectl get jobs -n monitoring

# Check job logs
kubectl logs -n monitoring job/backup-to-s3-XXXXXXXX

# Common issues:
# - IAM permissions: Verify role has S3 access
# - S3 bucket doesn't exist: Create the bucket
# - Incorrect bucket name in ConfigMap
```

### LoadBalancer Not Getting External IP

```bash
# Check service
kubectl describe svc monitor-app -n monitoring

# Check AWS Load Balancer Controller
kubectl get pods -n kube-system | grep aws-load-balancer

# If using EKS, ensure cluster has proper IAM permissions
# Check security groups allow traffic on port 80
```

---

## Security Considerations

### Production Hardening

1. **Change Default Passwords**

   ```bash
   # Update Grafana password in deployment
   kubectl edit secret grafana-admin -n monitoring
   ```

2. **Use Secrets Manager**

   ```bash
   # Instead of hardcoded secrets, use AWS Secrets Manager
   # Install External Secrets Operator or use CSI driver
   ```

3. **Enable Network Policies**

   ```yaml
   # Create network-policy.yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: monitor-app-policy
     namespace: monitoring
   spec:
     podSelector:
       matchLabels:
         app: monitor-app
     policyTypes:
       - Ingress
       - Egress
     # Define allowed traffic
   ```

4. **Use Private Container Registry**

   ```bash
   # Create pull secret for private registry
   kubectl create secret docker-registry regcred \
     --docker-server=YOUR_REGISTRY \
     --docker-username=YOUR_USERNAME \
     --docker-password=YOUR_PASSWORD \
     -n monitoring

   # Add to deployment
   imagePullSecrets:
     - name: regcred
   ```

5. **Enable Pod Security Standards**

   ```bash
   kubectl label namespace monitoring \
     pod-security.kubernetes.io/enforce=restricted
   ```

6. **Encrypt EBS Volumes**

   - Already enabled in StorageClass configuration
   - Verify: `kubectl get sc ebs-sc -o yaml`

7. **Enable S3 Bucket Encryption**
   - Applied in Step 1
   - Verify: `aws s3api get-bucket-encryption --bucket cecre-monitoring-backup`

---

## Monitoring the Monitor

The application exposes Prometheus metrics at `/metrics`:

```bash
# Port forward monitor app
kubectl port-forward -n monitoring svc/monitor-app 3001:3001

# View metrics
curl http://localhost:3001/metrics
```

These metrics are automatically scraped by Prometheus.

---

## Cleanup

To remove all monitoring components:

```bash
# Delete all resources
kubectl delete namespace monitoring

# Delete storage class (if not used by other apps)
kubectl delete sc ebs-sc

# Delete S3 bucket
aws s3 rb s3://cecre-monitoring-backup --force

# Delete IAM policy
aws iam delete-policy --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/CecreMonitoringBackupPolicy
```

---

## Additional Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **AWS EKS Best Practices**: https://aws.github.io/aws-eks-best-practices/

---

## Support

For issues:

1. Check logs: `kubectl logs -n monitoring POD_NAME`
2. Check events: `kubectl get events -n monitoring`
3. Review this troubleshooting guide
4. Open an issue in the repository

**Deployment Status**: Ready for production with proper configuration

**Last Updated**: November 23, 2025
