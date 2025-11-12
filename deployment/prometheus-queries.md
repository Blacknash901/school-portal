# Prometheus Queries for School Portal

## Basic Prometheus Queries

These queries work with the metrics Prometheus collects by default from Kubernetes.

### 1. Pod CPU Usage

```promql
# CPU usage per pod
rate(container_cpu_usage_seconds_total{namespace="default",pod=~"school-portal-.*"}[5m])

# Total CPU usage across all school-portal pods
sum(rate(container_cpu_usage_seconds_total{namespace="default",pod=~"school-portal-.*"}[5m]))
```

### 2. Pod Memory Usage

```promql
# Memory usage per pod in bytes
container_memory_usage_bytes{namespace="default",pod=~"school-portal-.*"}

# Memory usage as percentage of limit
(container_memory_usage_bytes{namespace="default",pod=~"school-portal-.*"} / container_spec_memory_limit_bytes{namespace="default",pod=~"school-portal-.*"}) * 100
```

### 3. Pod Status

```promql
# Number of running pods
count(kube_pod_status_phase{namespace="default",pod=~"school-portal-.*",phase="Running"})

# Pods not ready
kube_pod_status_ready{namespace="default",pod=~"school-portal-.*",condition="false"}
```

### 4. Pod Restarts

```promql
# Pod restart count
kube_pod_container_status_restarts_total{namespace="default",pod=~"school-portal-.*"}

# Restart rate (restarts per second)
rate(kube_pod_container_status_restarts_total{namespace="default",pod=~"school-portal-.*"}[15m])
```

### 5. Node Metrics

```promql
# Node CPU usage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node memory usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Node disk usage
(node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100
```

### 6. Network Traffic

```promql
# Network receive bytes per second
rate(container_network_receive_bytes_total{namespace="default",pod=~"school-portal-.*"}[5m])

# Network transmit bytes per second
rate(container_network_transmit_bytes_total{namespace="default",pod=~"school-portal-.*"}[5m])
```

### 7. Cluster-wide Metrics

```promql
# Total pods in cluster
count(kube_pod_info)

# Total nodes
count(kube_node_info)

# Pods by phase
sum by (phase) (kube_pod_status_phase{namespace="default"})
```

## Application-Specific Queries (when /metrics is working)

These will work once the app's /metrics endpoint is properly configured:

### 8. HTTP Requests

```promql
# Request rate
rate(http_requests_total[5m])

# Requests by status code
sum by (status) (rate(http_requests_total[5m]))

# Error rate (5xx errors)
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

### 9. Response Time

```promql
# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 50th percentile (median)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### 10. Rate Limiting

```promql
# 429 error rate
rate(http_requests_total{status="429"}[5m])

# Rate limit hit percentage
(sum(rate(http_requests_total{status="429"}[5m])) / sum(rate(http_requests_total[5m]))) * 100
```

## How to Use These Queries

### In Prometheus UI (http://YOUR_IP:30090)

1. Go to Graph tab
2. Paste any query above
3. Click "Execute"
4. Switch to "Graph" tab to see visualization

### Testing Queries

```bash
# Test from command line
curl -g 'http://YOUR_IP:30090/api/v1/query?query=up'

# Get pod CPU usage
curl -g 'http://YOUR_IP:30090/api/v1/query?query=rate(container_cpu_usage_seconds_total{namespace="default"}[5m])'
```

## Quick Health Check Queries

```promql
# Is Prometheus scraping targets?
up

# How many targets are up?
count(up == 1)

# School portal pods up?
up{job="kubernetes-pods",pod=~"school-portal-.*"}
```
