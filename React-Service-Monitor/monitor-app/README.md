# CECRE Monitoring Application

A comprehensive monitoring solution for Kubernetes clusters with Prometheus, Grafana, and real-time service monitoring.

## Features

- **Service Monitoring**: Monitor `portal.cecre.net` and other services
- **Prometheus Integration**: Real-time metrics collection and alerting
- **Grafana Dashboards**: Pre-configured dashboards with automatic data export
- **Kubernetes Monitoring**: Cluster, nodes, pods, services, and deployments monitoring
- **Persistent Storage**: S3 backup integration and EBS volumes for data persistence
- **Alert Management**: Pre-configured alerts for common issues

A real-time service uptime monitoring application built with React that tracks the availability and performance of multiple web services.

## Features

- 🔍 **Real-time Monitoring**: Automatically checks service status every 30 seconds
- 📊 **Metrics Dashboard**: Displays success/failure counts and latency statistics
- 🎨 **Modern UI**: Clean, responsive design with visual status indicators
- 📈 **Performance Tracking**: Tracks current and average latency for each service
- 🔄 **Manual Refresh**: Ability to manually trigger status checks

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/rsergio07/Service-Status-Monitor.git
cd Service-Status-Monitor
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

The application monitors a list of URLs defined in `src/config/urls.js`. To modify the monitored services, edit this file:

```javascript
export const MONITOR_URLS = [
  "https://www.google.com",
  "https://www.ibm.com",
  // Add your URLs here
];
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## How It Works

The application:

1. Fetches each URL using the Fetch API
2. Measures response latency
3. Records success/failure metrics
4. Updates the UI with real-time status information
5. Automatically refreshes every 30 seconds

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and development server
- **CSS3** - Styling with modern gradients and animations

## Note on CORS

When running locally, the app uses `no-cors` mode for fetch requests. For production use, you may need to:

- Set up a backend proxy
- Configure CORS headers on target services
- Use a service monitoring API

## Docker Support

The repository includes Docker configuration files in the `k8s/` directory for containerized deployment.

## Monitoring Configuration

Grafana dashboards and Prometheus configurations are available in the `monitoring/` directory for production deployments.

## License

See LICENSE.md for details.

## Contributing

See CONTRIBUTING.md for contribution guidelines.
