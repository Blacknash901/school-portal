# School Portal Monitoring Guide

**Complete guide to monitoring and maintaining your production deployment.**

---

## 🚨 Issue Fixed: Rate Limiting

### Problem

App crashed when reloaded several times:

1. App stops rendering
2. JSON error message "Too many requests..."
3. Host becomes unavailable

### Root Cause

**Rate limiting was too aggressive:**

- Limited to **100 requests per 15 minutes**
- A single page load makes multiple requests (HTML, JS, CSS, images, API calls)
- Refreshing 5-10 times triggered rate limit
- Users got blocked on normal usage

### Solution Applied

**Increased rate limit to 500 requests per 15 minutes:**

- Allows ~33 page loads per 15 minutes
- Health checks excluded from rate limiting
- Rate limit headers returned to clients
- More reasonable for production usage

**Files updated:**

- `server.js` - HTTP server rate limit
- `server-https.js` - HTTPS server rate limit

---

## 📊 Monitoring System

### Components

1. **Kubernetes Monitoring** (`monitoring.yaml`)

   - ServiceMonitor for Prometheus
   - Alert rules for common issues
   - Horizontal Pod Autoscaler (auto-scaling)
   - PodDisruptionBudget (high availability)

2. **Health Check Script** (`check-health.sh`)

   - Manual or automated health checks
   - Pod status monitoring
   - Resource usage tracking
   - Restart detection

3. **Built-in Health Endpoints**
   - `/api/health` - Liveness probe
   - `/api/health/ready` - Readiness probe
   - `/metrics` - Prometheus metrics

---

## 🚀 Quick Setup

### Automatic Deployment (Recommended)

**Monitoring is now automatically deployed with the Ansible playbook!**

When you run:

```bash
ansible-playbook -i inventory-production.yml playbook-production.yml
```

**It automatically deploys:**

- ✅ Prometheus (metrics collection)
- ✅ Grafana (dashboards and visualization)
- ✅ Horizontal Pod Autoscaler (2-5 replicas based on load)
- ✅ Alert rules for crashes and high resource usage
- ✅ PodDisruptionBudget (ensures 1 pod always available)
- ✅ Pre-configured School Portal dashboard

**Access URLs** (shown at end of playbook):

- **Grafana:** `http://YOUR_IP:30300`
- **Prometheus:** `http://YOUR_IP:30090`

**Default Grafana credentials:**

- Username: `admin`
- Password: `admin` (change on first login)

### Manual Deployment (Optional)

If you want to deploy monitoring separately or update it:

```bash
# From your local machine
cd deployment
./deploy-monitoring.sh --remote YOUR_IP --ssh-key /path/to/key.pem
```

### Test Health Check Script

```bash
# From your local machine
cd deployment
./check-health.sh --remote YOUR_IP --ssh-key /path/to/key.pem
```

**Expected output:**

```
========================================
School Portal Health Check
========================================

1. Checking Pod Status...
✓ Pod school-portal-xxx is running and ready
✓ Pod school-portal-yyy is running and ready

Summary: 2/2 pods ready

2. Checking Pod Restarts...
✓ Pod school-portal-xxx has no restarts
✓ Pod school-portal-yyy has no restarts

3. Checking Resource Usage...
NAME                  CPU(cores)   MEMORY(bytes)
school-portal-xxx     45m          312Mi
school-portal-yyy     38m          298Mi

4. Checking Service Availability...
✓ Service is available: NodePort on port 30443

5. Checking Recent Events...
✓ No recent error events

6. Testing Health Endpoint...
✓ Health endpoint is responding

========================================
Health Check Complete
========================================
```

---

## 🔍 What to Monitor

### 1. Pod Health

**Check regularly:**

```bash
microk8s kubectl get pods -n default -l app=school-portal

# Expected output:
# NAME                  READY   STATUS    RESTARTS   AGE
# school-portal-xxx     1/1     Running   0          2h
# school-portal-xxx     1/1     Running   0          2h
```

**🚨 Warning signs:**

- `STATUS` is not `Running`
- `READY` is `0/1` (not ready)
- `RESTARTS` > 5 (crash looping)

### 2. Resource Usage

**Check resource consumption:**

```bash
microk8s kubectl top pods -n default -l app=school-portal

# Watch for:
# - Memory > 900Mi (approaching 1Gi limit)
# - CPU > 800m (approaching 1000m limit)
```

**If resources are consistently high:**

```bash
# Increase resource limits in playbook
resources:
  limits:
    memory: "2Gi"  # Increase from 1Gi
    cpu: "2000m"   # Increase from 1000m
```

### 3. Application Logs

**View real-time logs:**

```bash
# All pods
microk8s kubectl logs -n default -l app=school-portal -f

# Specific pod
microk8s kubectl logs -n default school-portal-xxx -f

# Last 100 lines
microk8s kubectl logs -n default -l app=school-portal --tail=100
```

**🚨 Look for:**

- `Error` messages
- `429` status codes (rate limiting)
- Certificate errors
- Database connection errors
- Memory errors

### 4. Pod Restarts

**Check restart history:**

```bash
microk8s kubectl get pods -n default -l app=school-portal -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount,REASON:.status.containerStatuses[0].lastState.terminated.reason

# Investigate high restart counts:
microk8s kubectl describe pod school-portal-xxx -n default
```

### 5. Service Availability

**Test from outside:**

```bash
curl -k -I https://YOUR_IP:30443

# Expected: HTTP/1.1 200 OK
```

**Test from inside cluster:**

```bash
microk8s kubectl exec -n default deployment/school-portal -- wget -q -O- http://localhost:3000/api/health
```

---

## 🔔 Alerts Setup

### Alert Rules Included

The `monitoring.yaml` includes these alerts:

| Alert                    | Trigger                   | Severity |
| ------------------------ | ------------------------- | -------- |
| **PodCrashLooping**      | Pod restarts > 0 in 15min | Critical |
| **PodNotReady**          | Pod not ready for 5min    | Warning  |
| **HighMemoryUsage**      | Memory > 90% for 10min    | Warning  |
| **HighCPUUsage**         | CPU > 80% for 10min       | Warning  |
| **HighRateLimitHits**    | Many 429 errors           | Warning  |
| **DeploymentNoReplicas** | All pods down             | Critical |

### Email Alerts (Optional)

**Setup cron job for email notifications:**

```bash
# Add to crontab (on your local machine or monitoring server)
crontab -e

# Add this line (checks every 5 minutes):
*/5 * * * * /path/to/check-health.sh --remote YOUR_IP --ssh-key /path/to/key.pem || echo "Health check failed" | mail -s "Portal Health Alert" admin@example.com
```

---

## 📈 Auto-Scaling

### Horizontal Pod Autoscaler (HPA)

**Already configured in `monitoring.yaml`:**

- **Min replicas:** 2
- **Max replicas:** 5
- **Scale up when:**
  - CPU > 70%
  - Memory > 80%

**Check HPA status:**

```bash
microk8s kubectl get hpa -n default school-portal-hpa

# Example output:
# NAME                REFERENCE              TARGETS    MINPODS   MAXPODS   REPLICAS
# school-portal-hpa   Deployment/school-portal   45%/70%    2         5         2
```

**How it works:**

1. HPA monitors CPU and memory every 30s
2. If usage exceeds thresholds, scales up (adds pod)
3. If usage drops, scales down (removes pod) after 5min
4. Always maintains at least 2 replicas

---

## 🐛 Troubleshooting

### Issue: Pods Keep Restarting

**Check logs:**

```bash
microk8s kubectl logs -n default school-portal-xxx --previous
```

**Common causes:**

- Out of memory (OOMKilled)
- Certificate path errors
- Missing environment variables
- Rate limiting too aggressive

**Solutions:**

1. Increase memory limits
2. Check certificate configuration
3. Verify secrets are loaded
4. Review rate limit settings

### Issue: High Memory Usage

**Check detailed memory:**

```bash
microk8s kubectl exec -n default deployment/school-portal -- sh -c 'cat /proc/meminfo'
```

**Solutions:**

1. Increase memory limits in deployment
2. Check for memory leaks in logs
3. Review Sentry for errors
4. Consider adding more replicas

### Issue: Rate Limit Errors (429)

**Check rate limit headers:**

```bash
curl -k -I https://YOUR_IP:30443

# Look for headers:
# RateLimit-Limit: 500
# RateLimit-Remaining: 345
# RateLimit-Reset: 432
```

**Current limits:**

- 500 requests per 15 minutes
- ~33 page loads per 15 minutes

**To adjust:**
Edit `server.js` and `server-https.js`:

```javascript
max: 1000, // Increase to 1000 requests per 15min
```

### Issue: All Pods Down

**Check recent events:**

```bash
microk8s kubectl get events -n default --sort-by='.lastTimestamp' | tail -20
```

**Check deployment status:**

```bash
microk8s kubectl describe deployment school-portal -n default
```

**Force restart:**

```bash
microk8s kubectl rollout restart deployment school-portal -n default
```

---

## 📊 Metrics and Dashboards

### Prometheus Metrics

**Available at:** `http://YOUR_IP:30443/metrics`

**Key metrics:**

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `nodejs_heap_size_used_bytes` - Memory usage
- `process_cpu_user_seconds_total` - CPU usage

### Grafana Dashboard (Optional)

**Import dashboard:**

```bash
# Use the pre-configured dashboard
microk8s kubectl apply -f deployment/grafana-dashboard.json
```

**Access Grafana:**

1. Port forward: `microk8s kubectl port-forward -n monitoring svc/grafana 3000:3000`
2. Open: `http://localhost:3000`
3. Default login: admin/admin

---

## ✅ Daily Monitoring Checklist

### Morning Check (5 minutes)

```bash
# 1. Run health check
./deployment/check-health.sh --remote YOUR_IP

# 2. Check pod status
ssh ubuntu@YOUR_IP "microk8s kubectl get pods -n default -l app=school-portal"

# 3. Check resource usage
ssh ubuntu@YOUR_IP "microk8s kubectl top pods -n default -l app=school-portal"

# 4. Test app access
curl -k -I https://YOUR_IP:30443
```

### Weekly Review (15 minutes)

1. **Review logs for errors:**

   ```bash
   ssh ubuntu@YOUR_IP "microk8s kubectl logs -n default -l app=school-portal --since=7d | grep -i error"
   ```

2. **Check restart history:**

   ```bash
   ssh ubuntu@YOUR_IP "microk8s kubectl get pods -n default -l app=school-portal"
   ```

3. **Review rate limit usage:**

   - Check if many 429 errors in logs
   - Consider adjusting limits

4. **Disk space check:**

   ```bash
   ssh ubuntu@YOUR_IP "df -h"
   ```

5. **Update system:**
   ```bash
   ssh ubuntu@YOUR_IP "sudo apt update && sudo apt list --upgradable"
   ```

---

## 🔧 Automated Monitoring Setup

### Option 1: Cron Job (Simple)

```bash
# Add to crontab
crontab -e

# Check health every 5 minutes
*/5 * * * * /path/to/deployment/check-health.sh --remote YOUR_IP >> /var/log/portal-health.log 2>&1

# Send email if check fails
*/5 * * * * /path/to/deployment/check-health.sh --remote YOUR_IP || echo "Portal health check failed" | mail -s "Alert: Portal Down" admin@example.com
```

### Option 2: Prometheus + Alertmanager (Advanced)

**Install Prometheus stack:**

```bash
# On server
microk8s enable prometheus

# Apply alert rules
microk8s kubectl apply -f deployment/monitoring.yaml
```

**Configure Alertmanager:**

```yaml
# alertmanager-config.yaml
route:
  receiver: "email"
receivers:
  - name: "email"
    email_configs:
      - to: "admin@example.com"
        from: "alertmanager@example.com"
        smarthost: "smtp.gmail.com:587"
```

---

## 📞 Emergency Response

### If App is Down

1. **Check pod status:**

   ```bash
   microk8s kubectl get pods -n default -l app=school-portal
   ```

2. **Check logs:**

   ```bash
   microk8s kubectl logs -n default -l app=school-portal --tail=100
   ```

3. **Restart deployment:**

   ```bash
   microk8s kubectl rollout restart deployment school-portal -n default
   ```

4. **If still down, check service:**

   ```bash
   microk8s kubectl get svc -n default school-portal-service
   ```

5. **Last resort - delete and recreate pods:**
   ```bash
   microk8s kubectl delete pods -n default -l app=school-portal
   ```

### If Server is Down

1. **Check AWS instance status** in console
2. **Try SSH access**
3. **Check Security Group** allows required ports
4. **Reboot instance** if necessary
5. **Check system logs** after reboot:
   ```bash
   sudo journalctl -u snap.microk8s.daemon-kubelite --since "10 minutes ago"
   ```

---

## 📖 Additional Resources

- [Kubernetes Monitoring Best Practices](https://kubernetes.io/docs/tasks/debug/)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Node.js Performance Monitoring](https://nodejs.org/en/docs/guides/simple-profiling/)

---

## 🎯 Summary

**What we fixed:**

- ✅ Rate limiting adjusted (100 → 500 requests/15min)
- ✅ Health checks excluded from rate limiting
- ✅ Monitoring system added
- ✅ Auto-scaling configured
- ✅ Health check script created

**What to monitor:**

- Pod status and restarts
- Resource usage (CPU/Memory)
- Application logs for errors
- Service availability
- Rate limit usage

**Tools available:**

- `check-health.sh` - Manual health checks
- `monitoring.yaml` - Kubernetes monitoring
- Built-in health endpoints
- Prometheus metrics

**Next steps:**

1. Deploy monitoring: `kubectl apply -f monitoring.yaml`
2. Enable metrics-server: `microk8s enable metrics-server`
3. Test health check: `./check-health.sh --remote YOUR_IP`
4. Set up automated checks (cron or Prometheus)

---

**Your monitoring is now production-ready!** 🎉
