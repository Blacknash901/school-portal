/**
 * Kubernetes Monitor Component
 *
 * Comprehensive monitoring interface for Kubernetes cluster resources.
 * Displays detailed information about cluster state, workloads, and events.
 *
 * Features:
 * - Overview: Cluster summary, pod status distribution, recent events
 * - Nodes: List of cluster nodes with capacity and status
 * - Pods: All pods with status, namespace, restarts, and age
 * - Services: Kubernetes services with type, IPs, and ports
 * - Deployments: Deployment status with replica counts
 * - Events: Cluster events for troubleshooting
 *
 * Auto-refreshes every 30 seconds to show current cluster state.
 *
 * @component
 */

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config/urls";
import "./KubernetesMonitor.css";

const KubernetesMonitor = () => {
  // Cluster-level information (namespace count, etc.)
  const [clusterInfo, setClusterInfo] = useState(null);
  const [nodes, setNodes] = useState([]); // List of cluster nodes
  const [pods, setPods] = useState([]); // List of all pods
  const [services, setServices] = useState([]); // List of Kubernetes services
  const [deployments, setDeployments] = useState([]); // List of deployments
  const [events, setEvents] = useState([]); // Recent cluster events
  const [activeTab, setActiveTab] = useState("overview"); // Current tab view
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message

  /**
   * Fetch all Kubernetes cluster data in parallel
   * Makes simultaneous API calls for cluster info, nodes, pods, services,
   * deployments, and events for optimal performance
   */
  const fetchKubernetesData = async () => {
    try {
      setLoading(true);

      const [
        clusterRes,
        nodesRes,
        podsRes,
        servicesRes,
        deploymentsRes,
        eventsRes,
      ] = await Promise.all([
        fetch(API_ENDPOINTS.K8S_CLUSTER_INFO),
        fetch(API_ENDPOINTS.K8S_NODES),
        fetch(API_ENDPOINTS.K8S_PODS),
        fetch(API_ENDPOINTS.K8S_SERVICES),
        fetch(
          `${API_ENDPOINTS.K8S_CLUSTER_INFO.replace(
            "/cluster",
            "/deployments"
          )}`
        ),
        fetch(
          `${API_ENDPOINTS.K8S_CLUSTER_INFO.replace("/cluster", "/events")}`
        ),
      ]);

      const [
        cluster,
        nodesData,
        podsData,
        servicesData,
        deploymentsData,
        eventsData,
      ] = await Promise.all([
        clusterRes.json(),
        nodesRes.json(),
        podsRes.json(),
        servicesRes.json(),
        deploymentsRes.json(),
        eventsRes.json(),
      ]);

      setClusterInfo(cluster);
      setNodes(nodesData.nodes || []);
      setPods(podsData.pods || []);
      setServices(servicesData.services || []);
      setDeployments(deploymentsData.deployments || []);
      setEvents(eventsData.events || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching Kubernetes data:", err);
      setError("Failed to fetch Kubernetes cluster data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and set up auto-refresh every 30 seconds
  useEffect(() => {
    fetchKubernetesData();
    const interval = setInterval(fetchKubernetesData, 30000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  /**
   * Get CSS class for status badge based on status value
   * Maps Kubernetes status strings to visual indicators
   *
   * @param {string} status - The status value (Running, Pending, True, etc.)
   * @returns {string} CSS class name for styling
   */
  const getStatusColor = (status) => {
    if (status === "Running" || status === "True" || status === "Ready")
      return "status-success";
    if (status === "Pending") return "status-warning";
    return "status-error";
  };

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="overview-card">
        <h4>Cluster Info</h4>
        <div className="info-row">
          <span>Namespaces:</span>
          <span>{clusterInfo?.namespaceCount || 0}</span>
        </div>
        <div className="info-row">
          <span>Nodes:</span>
          <span>{nodes.length}</span>
        </div>
        <div className="info-row">
          <span>Pods:</span>
          <span>{pods.length}</span>
        </div>
        <div className="info-row">
          <span>Services:</span>
          <span>{services.length}</span>
        </div>
      </div>

      <div className="overview-card">
        <h4>Pod Status</h4>
        <div className="status-chart">
          {["Running", "Pending", "Failed", "Succeeded"].map((status) => {
            const count = pods.filter((p) => p.status === status).length;
            return (
              count > 0 && (
                <div key={status} className="status-bar">
                  <span className="status-label">{status}</span>
                  <div className="status-progress">
                    <div
                      className={`status-fill ${getStatusColor(status)}`}
                      style={{ width: `${(count / pods.length) * 100}%` }}
                    />
                  </div>
                  <span className="status-count">{count}</span>
                </div>
              )
            );
          })}
        </div>
      </div>

      <div className="overview-card">
        <h4>Recent Events</h4>
        <div className="events-mini">
          {events.slice(0, 5).map((event, idx) => (
            <div key={idx} className={`event-mini ${event.type.toLowerCase()}`}>
              <span className="event-time">
                {new Date(event.lastTimestamp).toLocaleTimeString()}
              </span>
              <span className="event-reason">{event.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNodes = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Version</th>
            <th>CPU</th>
            <th>Memory</th>
            <th>Pods</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, idx) => (
            <tr key={idx}>
              <td>{node.name}</td>
              <td>
                <span className={`status-badge ${getStatusColor(node.status)}`}>
                  {node.status}
                </span>
              </td>
              <td>{node.version}</td>
              <td>{node.capacity?.cpu}</td>
              <td>{node.capacity?.memory}</td>
              <td>{node.capacity?.pods}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPods = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Namespace</th>
            <th>Status</th>
            <th>Node</th>
            <th>Restarts</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {pods.map((pod, idx) => (
            <tr key={idx}>
              <td>{pod.name}</td>
              <td>{pod.namespace}</td>
              <td>
                <span className={`status-badge ${getStatusColor(pod.status)}`}>
                  {pod.status}
                </span>
              </td>
              <td>{pod.nodeName}</td>
              <td>{pod.restartCount}</td>
              <td>{new Date(pod.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderServices = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Namespace</th>
            <th>Type</th>
            <th>Cluster IP</th>
            <th>Ports</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc, idx) => (
            <tr key={idx}>
              <td>{svc.name}</td>
              <td>{svc.namespace}</td>
              <td>{svc.type}</td>
              <td>{svc.clusterIP}</td>
              <td>
                {svc.ports?.map((p) => `${p.port}:${p.targetPort}`).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDeployments = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Namespace</th>
            <th>Desired</th>
            <th>Current</th>
            <th>Ready</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map((deploy, idx) => (
            <tr key={idx}>
              <td>{deploy.name}</td>
              <td>{deploy.namespace}</td>
              <td>{deploy.replicas}</td>
              <td>{deploy.updatedReplicas || 0}</td>
              <td>{deploy.readyReplicas || 0}</td>
              <td>{deploy.availableReplicas || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading && !clusterInfo) {
    return (
      <div className="kubernetes-monitor">
        <h2>Kubernetes Cluster</h2>
        <div className="loading">Loading cluster data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kubernetes-monitor">
        <h2>Kubernetes Cluster</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="kubernetes-monitor">
      <div className="k8s-header">
        <h2>Kubernetes Cluster</h2>
        <button onClick={fetchKubernetesData} className="refresh-btn">
          Refresh
        </button>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "overview" ? "tab active" : "tab"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "nodes" ? "tab active" : "tab"}
          onClick={() => setActiveTab("nodes")}
        >
          Nodes ({nodes.length})
        </button>
        <button
          className={activeTab === "pods" ? "tab active" : "tab"}
          onClick={() => setActiveTab("pods")}
        >
          Pods ({pods.length})
        </button>
        <button
          className={activeTab === "services" ? "tab active" : "tab"}
          onClick={() => setActiveTab("services")}
        >
          Services ({services.length})
        </button>
        <button
          className={activeTab === "deployments" ? "tab active" : "tab"}
          onClick={() => setActiveTab("deployments")}
        >
          Deployments ({deployments.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "nodes" && renderNodes()}
        {activeTab === "pods" && renderPods()}
        {activeTab === "services" && renderServices()}
        {activeTab === "deployments" && renderDeployments()}
      </div>
    </div>
  );
};

export default KubernetesMonitor;
