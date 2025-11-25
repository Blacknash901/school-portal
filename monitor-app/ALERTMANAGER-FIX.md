# Alertmanager Deployment Issues and Fixes

## Issues Identified

### 1. alertmanager-webhook: CrashLoopBackOff (30 restarts)

**Root Cause**: The Secret definition in `k8s/alertmanager-deployment.yaml` contained template variables that were not being substituted.

**Fix Applied**:

- Removed the stringData section with template variables from the YAML file
- Added documentation explaining that the secret is created by Ansible playbook
- The playbook correctly creates the secret with actual values from GitHub Secrets

**Files Changed**:

- `monitor-app/k8s/alertmanager-deployment.yaml`

**How it works now**:

1. Ansible playbook reads GitHub Secrets: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID_AM`, `AZURE_CLIENT_SECRET_AM`
2. Playbook creates the secret with actual values using `kubectl apply`
3. The webhook deployment references the secret keys correctly:
   - `AZURE_CLIENT_ID` (env var) ← `AZURE_CLIENT_ID_AM` (secret key)
   - `AZURE_CLIENT_SECRET` (env var) ← `AZURE_CLIENT_SECRET_AM` (secret key)

### 2. alertmanager: Pending (PodScheduled: False, no events)

**Status**: Requires investigation on the cluster

**Possible Causes**:

- Node resource constraints (t4g.medium has 2 vCPU, 4GB RAM)
- Taints or node selectors preventing scheduling
- Another pod consuming all resources

**Resource Requests** (Alertmanager pod):

- CPU: 100m request, 500m limit
- Memory: 128Mi request, 256Mi limit

**Diagnosis Steps**:

```bash
# Check node capacity and allocatable resources
kubectl describe nodes

# Check all pod resource usage
kubectl top pods -A

# Check for taints
kubectl describe nodes | grep -A5 Taints

# Check scheduler events
kubectl get events -n monitoring --sort-by='.lastTimestamp'
```

### 3. kube-state-metrics: CrashLoopBackOff (45 restarts)

**Root Cause**: Liveness/readiness probes were too aggressive (5 second delay, 5 second timeout)

**Fix Applied**:

- Increased initialDelaySeconds: 15s for liveness, 10s for readiness
- Increased timeoutSeconds: 10s for both probes
- Added periodSeconds: 30s (check every 30 seconds instead of default 10s)
- Added failureThreshold: 3 (allow 3 failures before restarting)
- Added resource requests/limits (50m-200m CPU, 128Mi-256Mi memory)

**Files Changed**:

- `monitor-app/k8s/kube-state-metrics.yaml`

**Why this fixes it**:
The container starts successfully but the probes were killing it before it could fully initialize. The logs show:

- ✅ Starting kube-state-metrics
- ✅ Tested communication with server
- ❌ Then exits (killed by probe failure)

With longer delays and timeouts, the service has time to:

1. Start the HTTP servers on ports 8080 and 8081
2. Initialize all metric collectors
3. Respond to health checks

## Deployment Steps

### 1. Verify GitHub Secrets are Set

Ensure these secrets exist in GitHub repository settings:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID_AM`
- `AZURE_CLIENT_SECRET_AM`

### 2. Redeploy Monitoring Stack

```bash
# From deployment/ansible directory
ansible-playbook -i inventory-production-ssh.yml deploy-monitoring-stack.yml
```

This will:

1. Delete existing alertmanager-webhook-secrets
2. Create new secret with actual values from GitHub Secrets
3. Apply all monitoring manifests (Prometheus, Grafana, Alertmanager, kube-state-metrics)

### 3. Verify Secret Creation

```bash
# Check if secret was created correctly
kubectl get secret -n monitoring alertmanager-webhook-secrets

# Verify secret has the right keys (don't decode, just check keys)
kubectl get secret -n monitoring alertmanager-webhook-secrets -o jsonpath='{.data}' | jq 'keys'
# Should show: ["AZURE_CLIENT_ID_AM", "AZURE_CLIENT_SECRET_AM", "AZURE_TENANT_ID", "EMAIL_TO"]
```

### 4. Monitor Pod Status

```bash
# Watch pods come up
kubectl get pods -n monitoring -w

# Check alertmanager-webhook logs
kubectl logs -n monitoring -l app=alertmanager-webhook -f
```

## Expected Behavior After Fix

### alertmanager-webhook

- Status: Running (1/1)
- Logs should show:
  ```
  Server running on port 8080
  Azure AD authentication configured
  ```

### alertmanager

- Status: Running (1/1) or Pending (requires investigation)
- Accessible at: https://portal.cecre.net/alertmanager

### kube-state-metrics

- Status: Running (1/1) or CrashLoopBackOff (requires log analysis)
- Should expose metrics at: http://kube-state-metrics.monitoring.svc:8080/metrics

## Testing Alert Notifications

Once all pods are running, test the email notification:

```bash
# Send a test alert
kubectl port-forward -n monitoring svc/alertmanager 9093:9093

# In another terminal, send a test alert
curl -H "Content-Type: application/json" -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "This is a test alert"
  }
}]' http://localhost:9093/api/v1/alerts
```

Check if email is received at: portal_status_notification@cecre.net

## Files Modified

- `monitor-app/k8s/alertmanager-deployment.yaml` - Removed template variables from Secret, added documentation
- `monitor-app/k8s/kube-state-metrics.yaml` - Fixed probe timing and added resource limits

## Files to Review

- `deployment/ansible/deploy-monitoring-stack.yml` - Secret creation (already correct)
- `monitor-app/k8s/kube-state-metrics.yaml` - RBAC configuration (already correct)
