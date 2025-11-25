# CECRE Portal & Monitoring System

> **🎓 Final Project** - DevOps/Monitoring Academy  
> A production-grade educational portal with comprehensive monitoring, alerting, and full infrastructure automation.

**Live Demo:** https://portal.cecre.net

[![Deploy Status](https://github.com/Blacknash901/school-portal/actions/workflows/deploy-complete.yml/badge.svg)](https://github.com/Blacknash901/school-portal/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📚 Quick Links

- **[🎯 Final Project Summary](docs/FINAL-PROJECT-SUMMARY.md)** - Complete project overview for academy submission
- **[📸 Screenshots Guide](docs/SCREENSHOTS.md)** - Evidence and documentation requirements
- **[🚨 Alertmanager Setup](docs/guides/ALERTMANAGER-SETUP.md)** - Email notification configuration
- **[🤝 Contributing](CONTRIBUTING.md)** - Contribution guidelines
- **[📄 License](LICENSE)** - MIT License

---

## 🎓 Academy Project Compliance

This project fulfills **all required and bonus requirements** for the final academy project:

| Requirement                        | Status                                        |
| ---------------------------------- | --------------------------------------------- |
| ✅ Application with metrics/alerts | Complete                                      |
| ✅ Kubernetes deployment           | MicroK8s on AWS EC2                           |
| ✅ Prometheus scraping             | 7+ scrape jobs configured                     |
| ✅ Grafana dashboards              | Provisioned with datasources                  |
| ✅ Alertmanager deployment         | Email notifications enabled                   |
| ✅ Professional documentation      | README, LICENSE, CONTRIBUTING                 |
| 🌟 Alertmanager notifications      | Email to portal_status_notification@cecre.net |
| 🌟 Infrastructure as Code          | Terraform + Ansible                           |
| 🌟 CI/CD Pipeline                  | GitHub Actions (4-stage workflow)             |

**See [Final Project Summary](docs/FINAL-PROJECT-SUMMARY.md) for complete details.**

---

## 🏗️ System Architecture

```
GitHub Actions (CI/CD)
        ↓
AWS EC2 (t4g.medium ARM64)
        ↓
    MicroK8s
        ↓
    ┌───────┬──────────┬────────────┐
    ↓       ↓          ↓            ↓
  Portal  Monitor  Prometheus  Alertmanager
   App     App      + Grafana
```

**Access Points:**

- 🌐 Portal: https://portal.cecre.net/
- 📊 Monitor: https://portal.cecre.net/monitor
- 🔥 Prometheus: https://portal.cecre.net/prometheus
- 📈 Grafana: https://portal.cecre.net/grafana (admin/admin123)
- 🚨 Alertmanager: https://portal.cecre.net/alertmanager

---

## 🚀 Quick Start

### Local Development

**Portal App:**
```bash
cd portal-app
npm install
npm start
```
Access at `http://localhost:3000`

**Monitor App:**
```bash
cd monitor-app
npm install
npm run dev:all  # Runs both frontend and backend
```
Access at `http://localhost:5173`

### Environment Setup

1. Copy `portal-app/env.example` to `portal-app/.env`
2. Fill in your Azure AD credentials and other configuration
3. See `portal-app/env.example` for all available options

## 📁 Project Structure

```
school-portal/
├── portal-app/             # Main Portal Application (v1.0.16)
│   ├── src/                # React application source
│   │   ├── components/     # React components
│   │   ├── auth/           # MSAL authentication
│   │   ├── data/           # App definitions & role mappings
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── Dockerfile          # Production Docker image
│   ├── server.js           # Development server
│   ├── server-https.js     # Production HTTPS server
│   └── env.example         # Environment variables template
├── monitor-app/            # Monitoring Dashboard (v1.0.0)
│   ├── src/                # React monitoring UI
│   ├── server/             # Express backend for Prometheus/Grafana
│   ├── k8s/                # Kubernetes manifests
│   └── Dockerfile          # Monitoring app Docker image
├── alertmanager-webhook/   # Email notification service
│   ├── server.js           # Webhook for Alertmanager → Email
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Multi-platform webhook image
├── deployment/
│   └── ansible/            # Ansible playbooks for deployment
│       ├── deploy-app.yml
│       ├── deploy-monitor-app.yml
│       ├── deploy-monitoring-stack.yml
│       └── setup-infrastructure.yml
├── infrastructure/
│   └── terraform/          # AWS infrastructure as code
│       ├── main.tf
│       ├── modules/        # Terraform modules
│       └── terraform.tfvars
├── .github/workflows/      # CI/CD pipelines
│   ├── deploy-complete.yml # Full deployment workflow
│   └── build-*.yml         # Individual build jobs
├── docs/                   # Project documentation
│   ├── FINAL-PROJECT-SUMMARY.md
│   ├── guides/             # Setup and configuration guides
│   └── archived/           # Historical documentation
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
└── README.md               # This file
```

## ✨ Features

### Authentication & Authorization

- ✅ Microsoft Azure AD (MSAL) authentication
- ✅ Role-based access control (RBAC)
- ✅ Group-based app visibility
- ✅ Secure session management

### User Roles

- **Students:** Full app suite (Office, Teams, Moodle, etc.)
- **Teachers:** Teaching tools + admin apps
- **Parents:** Communication apps (Moodle, Teams, Outlook)
- **Guests:** Basic access (Moodle, Teams)
- **Staff/Admins:** Full administrative access

### User Interface

- ✅ Beautiful dark/light theme toggle
- ✅ Smooth animations and transitions
- ✅ Responsive design (mobile-friendly)
- ✅ Organized app grid with custom icons
- ✅ WordPress news feed integration

### Technical Features

- ✅ Production-ready with Docker
- ✅ Health checks and monitoring
- ✅ Rate limiting protection
- ✅ SSL/TLS support
- ✅ Error tracking with Sentry
- ✅ S3 logging integration

## 🔧 Configuration

### Environment Variables

Copy `portal-app/env.example` to `portal-app/.env` and configure:

```bash
# Azure AD Authentication
REACT_APP_MSAL_CLIENT_ID=your-azure-client-id-here
REACT_APP_MSAL_TENANT_ID=your-azure-tenant-id-here
REACT_APP_AZURE_CLIENT_ID=your-azure-client-id-here
REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id-here
REACT_APP_REDIRECT_URI=http://localhost:3000

# AWS S3 Logging (Optional)
REACT_APP_S3_BUCKET_NAME=your-bucket-name
REACT_APP_S3_REGION=us-east-1
REACT_APP_S3_ACCESS_KEY_ID=your-access-key
REACT_APP_S3_SECRET_ACCESS_KEY=your-secret-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# Sentry Error Tracking (Optional)
REACT_APP_SENTRY_DSN=your-sentry-dsn-here
REACT_APP_SENTRY_ENVIRONMENT=development
REACT_APP_ENABLE_SENTRY=false
SENTRY_DSN=your-sentry-dsn-here

# WordPress RSS Feed
REACT_APP_WORDPRESS_FEED_URL=https://devocecre.wordpress.com/feed

# Google OAuth (Optional)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
REACT_APP_ENABLE_GOOGLE_LOGIN=false

# Server Configuration
NODE_ENV=development
PORT=3000
HTTPS_PORT=443
CERT_PATH=/etc/letsencrypt/live/portal.cecre.net/fullchain.pem
KEY_PATH=/etc/letsencrypt/live/portal.cecre.net/privkey.pem
```

See `portal-app/env.example` for complete configuration options.

## 🐳 Docker

### Build Portal App

```bash
cd portal-app
docker build -t blacknash/cecre:latest .
```

### Build Monitor App

```bash
cd monitor-app
docker build -t blacknash/monitor:latest .
```

### Build Alertmanager Webhook

```bash
cd alertmanager-webhook
docker build -t blacknash/alertmanager-webhook:latest .
```

### Run Portal App

```bash
docker run -d \
  -p 3000:3000 \
  -p 443:443 \
  --env-file portal-app/.env \
  blacknash/cecre:latest
```

## 🧪 Testing

```bash
cd portal-app

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 🏗️ Build

**Portal App:**
```bash
cd portal-app
npm run build
```

**Monitor App:**
```bash
cd monitor-app
npm run build
```

## 📦 CI/CD

This project uses GitHub Actions for complete infrastructure and application deployment:

**Deploy Complete Stack Workflow** (`.github/workflows/deploy-complete.yml`):
- ✅ **Job 1:** Deploy infrastructure with Terraform (AWS EC2, EBS, Security Groups)
- ✅ **Job 2:** Build and deploy Portal App to Kubernetes
- ✅ **Job 3:** Build Alertmanager Webhook (multi-arch: ARM64 + AMD64)
- ✅ **Job 4:** Build and deploy Monitor App to Kubernetes
- ✅ **Job 5:** Deploy monitoring stack (Prometheus, Grafana, Alertmanager)

**Deployment Flow:**
```
Terraform → Ansible → Docker Build → Kubernetes Deploy
```

See [Deploy Complete Workflow](.github/workflows/deploy-complete.yml) for details.

### GitHub Secrets Required

Configure these secrets in GitHub repository settings:

**Infrastructure & Deployment:**
- `AWS_ACCESS_KEY_ID` - AWS credentials for Terraform
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: us-east-1)
- `SSH_PRIVATE_KEY` - SSH key for EC2 access
- `EC2_HOST` - EC2 instance public IP/DNS
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token

**Portal Application:**
- `AZURE_TENANT_ID` - Azure AD tenant ID (shared with Alertmanager)
- `REACT_APP_MSAL_CLIENT_ID` - Azure AD app for user login
- `AZURE_CLIENT_ID` - Azure AD app for Graph API
- `AZURE_CLIENT_SECRET` - Client secret for Graph API
- `SESSION_SECRET` - Express session encryption key
- `MONGODB_URI` - MongoDB connection string
- `REACT_APP_REDIRECT_URI` - Production redirect URI

**Alertmanager Email Notifications:**
- `AZURE_CLIENT_ID_AM` - Azure AD app for sending emails
- `AZURE_CLIENT_SECRET_AM` - Client secret for email app

**Optional:**
- `REACT_APP_S3_BUCKET_NAME` - S3 bucket for logging
- `REACT_APP_S3_REGION` - AWS region
- `REACT_APP_S3_ACCESS_KEY_ID` - AWS access key
- `REACT_APP_S3_SECRET_ACCESS_KEY` - AWS secret key
- `REACT_APP_WORDPRESS_FEED_URL` - WordPress feed URL
- `REACT_APP_SENTRY_DSN` - Sentry DSN
- `REACT_APP_ENABLE_SENTRY` - Enable Sentry (true/false)
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID

**See [GitHub Secrets Reference](docs/guides/GITHUB-SECRETS-REFERENCE.md) for complete details.**

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues or questions, please open an issue on GitHub.

---

**Portal App Version:** 1.0.16  
**Monitor App Version:** 1.0.0  
**Last Updated:** November 2025
