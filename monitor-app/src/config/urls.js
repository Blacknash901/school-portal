// URLs to monitor
export const MONITOR_URLS = ["https://portal.cecre.net"];

const normalizeUrl = (value) =>
  typeof value === "string" ? value.trim().replace(/\/$/, "") : value;

const resolvedEnvApiUrl = normalizeUrl(import.meta.env.VITE_API_URL);
const runtimeOrigin =
  typeof window !== "undefined" ? window.location.origin : undefined;
const resolvedDefaultApiUrl = import.meta.env.DEV
  ? "http://localhost:3001"
  : runtimeOrigin ? `${runtimeOrigin}/monitor` : "http://localhost:3001";

// API endpoints for the backend (default to same origin in production)
export const API_BASE_URL = normalizeUrl(
  resolvedEnvApiUrl || resolvedDefaultApiUrl
);

export const API_ENDPOINTS = {
  // Prometheus endpoints
  PROMETHEUS_QUERY: `${API_BASE_URL}/api/prometheus/query`,
  PROMETHEUS_QUERY_RANGE: `${API_BASE_URL}/api/prometheus/query_range`,
  PROMETHEUS_ALERTS: `${API_BASE_URL}/api/prometheus/alerts`,
  PROMETHEUS_TARGETS: `${API_BASE_URL}/api/prometheus/targets`,

  // Grafana endpoints
  GRAFANA_DASHBOARDS: `${API_BASE_URL}/api/grafana/dashboards`,
  GRAFANA_DASHBOARD: `${API_BASE_URL}/api/grafana/dashboard`,
  GRAFANA_SNAPSHOT: `${API_BASE_URL}/api/grafana/snapshot`,

  // Kubernetes endpoints
  K8S_CLUSTER_INFO: `${API_BASE_URL}/api/k8s/cluster`,
  K8S_NODES: `${API_BASE_URL}/api/k8s/nodes`,
  K8S_PODS: `${API_BASE_URL}/api/k8s/pods`,
  K8S_SERVICES: `${API_BASE_URL}/api/k8s/services`,

  // Service monitoring
  SERVICE_STATUS: `${API_BASE_URL}/api/services/status`,
};

// Prometheus queries for common metrics
export const PROMETHEUS_QUERIES = {
  CPU_USAGE: "sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)",
  MEMORY_USAGE: "sum(container_memory_usage_bytes) by (pod)",
  POD_COUNT: "count(kube_pod_info)",
  NODE_CPU: 'sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) by (instance)',
  NODE_MEMORY:
    "node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100",
  HTTP_REQUESTS: "sum(rate(http_requests_total[5m]))",
  HTTP_ERRORS: 'sum(rate(http_requests_total{status=~"5.."}[5m]))',
};
