import express from "express";
import k8s from "@kubernetes/client-node";

const router = express.Router();

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();

try {
  // Try to load in-cluster config first (when running in K8s)
  kc.loadFromCluster();
} catch (e) {
  // Fall back to default config (for local development)
  try {
    kc.loadFromDefault();
  } catch (err) {
    console.warn("Warning: Could not load Kubernetes config:", err.message);
  }
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sMetricsApi = kc.makeApiClient(k8s.Metrics);

// Get cluster information
router.get("/cluster", async (req, res) => {
  try {
    const version = await k8sApi.getAPIVersions();
    const namespaces = await k8sApi.listNamespace();

    res.json({
      version: version.body,
      namespaceCount: namespaces.body.items.length,
      namespaces: namespaces.body.items.map((ns) => ns.metadata.name),
    });
  } catch (error) {
    console.error("K8s cluster info error:", error.message);
    res.status(500).json({
      error: "Failed to fetch cluster info",
      message: error.message,
    });
  }
});

// Get nodes information
router.get("/nodes", async (req, res) => {
  try {
    const nodesResponse = await k8sApi.listNode();
    const nodes = nodesResponse.body.items.map((node) => ({
      name: node.metadata.name,
      status: node.status.conditions.find((c) => c.type === "Ready")?.status,
      version: node.status.nodeInfo.kubeletVersion,
      osImage: node.status.nodeInfo.osImage,
      capacity: {
        cpu: node.status.capacity.cpu,
        memory: node.status.capacity.memory,
        pods: node.status.capacity.pods,
      },
      allocatable: {
        cpu: node.status.allocatable.cpu,
        memory: node.status.allocatable.memory,
        pods: node.status.allocatable.pods,
      },
      addresses: node.status.addresses,
      createdAt: node.metadata.creationTimestamp,
    }));

    res.json({ nodes });
  } catch (error) {
    console.error("K8s nodes error:", error.message);
    res.status(500).json({
      error: "Failed to fetch nodes",
      message: error.message,
    });
  }
});

// Get pods information
router.get("/pods", async (req, res) => {
  try {
    const namespace = req.query.namespace || "";
    const podsResponse = namespace
      ? await k8sApi.listNamespacedPod(namespace)
      : await k8sApi.listPodForAllNamespaces();

    const pods = podsResponse.body.items.map((pod) => ({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
      status: pod.status.phase,
      conditions: pod.status.conditions,
      podIP: pod.status.podIP,
      nodeName: pod.spec.nodeName,
      containers: pod.spec.containers.map((c) => ({
        name: c.name,
        image: c.image,
        ready: pod.status.containerStatuses?.find((cs) => cs.name === c.name)
          ?.ready,
      })),
      createdAt: pod.metadata.creationTimestamp,
      restartCount:
        pod.status.containerStatuses?.reduce(
          (sum, cs) => sum + cs.restartCount,
          0
        ) || 0,
    }));

    res.json({ pods });
  } catch (error) {
    console.error("K8s pods error:", error.message);
    res.status(500).json({
      error: "Failed to fetch pods",
      message: error.message,
    });
  }
});

// Get services information
router.get("/services", async (req, res) => {
  try {
    const namespace = req.query.namespace || "";
    const servicesResponse = namespace
      ? await k8sApi.listNamespacedService(namespace)
      : await k8sApi.listServiceForAllNamespaces();

    const services = servicesResponse.body.items.map((svc) => ({
      name: svc.metadata.name,
      namespace: svc.metadata.namespace,
      type: svc.spec.type,
      clusterIP: svc.spec.clusterIP,
      externalIPs: svc.spec.externalIPs,
      ports: svc.spec.ports,
      selector: svc.spec.selector,
      createdAt: svc.metadata.creationTimestamp,
    }));

    res.json({ services });
  } catch (error) {
    console.error("K8s services error:", error.message);
    res.status(500).json({
      error: "Failed to fetch services",
      message: error.message,
    });
  }
});

// Get deployments information
router.get("/deployments", async (req, res) => {
  try {
    const namespace = req.query.namespace || "";
    const deploymentsResponse = namespace
      ? await k8sAppsApi.listNamespacedDeployment(namespace)
      : await k8sAppsApi.listDeploymentForAllNamespaces();

    const deployments = deploymentsResponse.body.items.map((deploy) => ({
      name: deploy.metadata.name,
      namespace: deploy.metadata.namespace,
      replicas: deploy.spec.replicas,
      availableReplicas: deploy.status.availableReplicas,
      readyReplicas: deploy.status.readyReplicas,
      updatedReplicas: deploy.status.updatedReplicas,
      conditions: deploy.status.conditions,
      createdAt: deploy.metadata.creationTimestamp,
    }));

    res.json({ deployments });
  } catch (error) {
    console.error("K8s deployments error:", error.message);
    res.status(500).json({
      error: "Failed to fetch deployments",
      message: error.message,
    });
  }
});

// Get events
router.get("/events", async (req, res) => {
  try {
    const namespace = req.query.namespace || "default";
    const eventsResponse = await k8sApi.listNamespacedEvent(namespace);

    const events = eventsResponse.body.items
      .sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))
      .slice(0, 100) // Limit to last 100 events
      .map((event) => ({
        type: event.type,
        reason: event.reason,
        message: event.message,
        count: event.count,
        firstTimestamp: event.firstTimestamp,
        lastTimestamp: event.lastTimestamp,
        involvedObject: {
          kind: event.involvedObject.kind,
          name: event.involvedObject.name,
        },
      }));

    res.json({ events });
  } catch (error) {
    console.error("K8s events error:", error.message);
    res.status(500).json({
      error: "Failed to fetch events",
      message: error.message,
    });
  }
});

export default router;
