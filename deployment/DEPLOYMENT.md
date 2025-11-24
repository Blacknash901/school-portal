docker build -t school-portal:latest .
docker run -d \
docker logs -f school-portal
npm run server:https
docker build -t school-portal .
docker run -p 3443:3443 school-portal

# 🚀 School Portal Deployment Guide (2025 Refresh)

Single reference for building, testing, and deploying the School Portal platform after the repository re-organization.

## 📦 Repository Layout (Top-Level)

```
school-portal/
├── portal-app/                # Main user-facing portal (React + Node server)
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   ├── src/
│   └── server*.js
├── React-Service-Monitor/     # Monitoring UI (lives beside the portal)
│   └── monitor-app/
├── deployment/
│   ├── ansible/               # Playbooks for infra + app
│   └── docs, guides, scripts
├── infrastructure/
│   └── terraform/             # AWS + networking + IAM
└── docs/                      # Additional how-tos
```

> **Reminder:** All commands in this guide assume you are at the repo root unless otherwise noted.

---

## 🔑 Required GitHub Secrets

| Secret                                                                                                            | Used by            | Purpose                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------- |
| `DOCKER_USERNAME`, `DOCKER_PASSWORD`                                                                              | `docker-build.yml` | Pushes portal image to Docker Hub.        |
| `REACT_APP_MSAL_CLIENT_ID`, `REACT_APP_MSAL_TENANT_ID`                                                            | build + deploy     | Front-end MSAL auth.                      |
| `REACT_APP_AZURE_CLIENT_ID`, `REACT_APP_AZURE_TENANT_ID`                                                          | build + deploy     | Backend Azure AD usage.                   |
| `REACT_APP_REDIRECT_URI`                                                                                          | build + deploy     | Prod redirect used in MSAL config.        |
| `REACT_APP_S3_BUCKET_NAME`, `REACT_APP_S3_REGION`, `REACT_APP_S3_ACCESS_KEY_ID`, `REACT_APP_S3_SECRET_ACCESS_KEY` | build + deploy     | Browser logging/upload config.            |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`                                                        | deploy workflow    | Server-side S3 uploads + CLI tools.       |
| `S3_BUCKET_NAME`                                                                                                  | deploy workflow    | Backup bucket for scripts (server-side).  |
| `REACT_APP_SENTRY_DSN`, `REACT_APP_SENTRY_ENVIRONMENT`, `REACT_APP_ENABLE_SENTRY`, `SENTRY_DSN`                   | build + deploy     | Frontend + backend telemetry.             |
| `REACT_APP_WORDPRESS_FEED_URL`                                                                                    | build + deploy     | News feed source.                         |
| `REACT_APP_GOOGLE_CLIENT_ID`                                                                                      | build + deploy     | Google auth integrations.                 |
| `TF_API_TOKEN`                                                                                                    | deploy workflow    | Terraform Cloud/CLI auth.                 |
| `PRODUCTION_DOMAIN` (optional)                                                                                    | deploy workflow    | Overrides default `portal.cecre.net`.     |
| `USE_IP` (optional)                                                                                               | deploy workflow    | Force ingress to use IP ("true"/"false"). |
| `USE_HTTPS` (optional)                                                                                            | deploy workflow    | Toggle HTTPS for IP deploys.              |
| `LETSENCRYPT_EMAIL`                                                                                               | deploy workflow    | Passed into Ansible for cert-manager.     |
| `K8S_NAMESPACE` (optional)                                                                                        | deploy workflow    | Target namespace (defaults to `default`). |

> Add all secrets under **Settings → Secrets and variables → Actions** in your GitHub repository.

---

## 💻 Local Development (Portal)

```bash
cd portal-app
npm install
cp .env.example .env   # add Azure + S3 + Sentry values
npm run server:https   # serves https://localhost:3443
```

Tips:

- Update `.env` inside `portal-app/` (CI generates one automatically during deploys).
- Certificates for local HTTPS live in `portal-app/certs/`.
- For mobile testing, run `ipconfig getifaddr en0` and visit `https://<IP>:3443` (accept warning).

---

## 🔁 CI/CD Overview

### 1. Docker Build Pipeline (`.github/workflows/docker-build.yml`)

- Triggered on PRs/pushes touching `portal-app/**`.
- Jobs:
  - **test**: `npm ci` + Jest from `portal-app/`.
  - **build**: Logs in to Docker Hub, builds multi-arch image from `portal-app/`, pushes `blacknash/cecre:<version>` and `latest`.
- Build arguments inject all React `REACT_APP_*` secrets, so missing secrets cause build failures.

### 2. Deploy Pipelines

- **`deploy.yml`** (hosted runner) & **`deploy-self-hosted.yml`** (runner on the EC2 box) share logic:
  1. Extract version from `portal-app/package.json` (or manual input).
  2. Generate `.env` from secrets (writing to repo root for Ansible).
  3. Use Terraform outputs to grab EC2 IP + SSH key (stored temporarily as `private_key.pem`).
  4. Generate dynamic Ansible inventory with runtime values and flags (`use_ip`, `use_https`, domain, etc.).
  5. Decide what to run (`deploy-all.yml`, `deploy-app.yml`, `deploy-monitoring.yml`) depending on MicroK8s availability and requested `deploy_type`.

> Keep Terraform state in sync before running `deploy.yml` locally (`terraform init && terraform plan/apply` inside `infrastructure/terraform`).

---

## 🧠 How Deployments Actually Work

1. **Terraform (infrastructure/terraform)**

   - Creates VPC, subnets, the EC2 host, IAM role, S3 bucket, IAM policies, Elastic IP, etc.
   - Provides outputs consumed by workflows (`ec2_instance_1_public_ip`, EBS info, private key).

2. **Ansible (deployment/ansible)**

   - `setup-infrastructure.yml`: configures Docker, MicroK8s, mounts the EBS volume, installs AWS CLI + Snap packages, configures firewall.
   - `deploy-app.yml`: pushes Docker image into MicroK8s, applies manifests, wires TLS/ingress, etc.
   - `deploy-monitoring.yml`: optional Prometheus/Grafana stack (uses templates under `deployment/`).

3. **Portal Runtime (portal-app/)**

   - Builds React static assets + Node API.
   - Pods expose HTTP (3000) internally and TLS via MicroK8s ingress.
   - `/metrics` is internal-only (ingress denies external access); Prometheus hits the service cluster-internally.

4. **Monitor App (React-Service-Monitor/monitor-app)**
   - Separate React app for dashboards. Follow its README for build/deploy (not automated yet).

---

## 📜 Manual Deployment Recipes

### Run the Portal Locally via Docker

```bash
cd portal-app
docker build -t school-portal:local .
docker run -d \
  -p 3000:3000 \
  -p 3443:3443 \
  --env-file .env \
  --name school-portal \
  school-portal:local
```

### Trigger full Ansible deployment yourself

```bash
cd deployment/ansible
ansible-playbook -i inventory-production-ssh.yml deploy-all.yml
```

### Redeploy just the app

```bash
cd deployment/ansible
ansible-playbook -i inventory-production-ssh.yml deploy-app.yml
```

### Interacting with MicroK8s

```bash
ssh ubuntu@<EC2_IP>
microk8s kubectl get pods -A
microk8s kubectl logs -n default deployment/school-portal
```

---

## 🧪 Verification & Troubleshooting

- **Health checks**: `curl https://portal.cecre.net/api/health` or `curl http://localhost:3000/api/health` (inside pod).
- **Metrics**: From the EC2 host: `curl http://127.0.0.1:3000/metrics` or port-forward the deployment.
- **Ingress debugging**: `microk8s kubectl describe ingress school-portal-ingress`.
- **Storage**: `lsblk` on the host should show the 64 GB EBS volume mounted at `/var/snap/microk8s/common`.
- **Secrets mismatch**: If GitHub workflows fail early, confirm every secret in the table above exists.

---

## ✅ Deployment Checklist

1. Terraform state is applied and outputs accessible.
2. GitHub secrets table is complete (double-check new ones after future features).
3. DNS (`portal.cecre.net`) points to the current Elastic IP.
4. `docker-build.yml` succeeded (image tagged with the desired version).
5. `deploy.yml` (or the self-hosted variant) finished without errors.
6. Portal loads over HTTPS, `/metrics` is blocked externally but readable internally.
7. Monitoring stack (optional) is deployed if `deploy-monitoring.yml` ran.

---

**Need more?** See:

- `deployment/ansible/README.md` for playbook internals.
- `docs/guides/HTTPS-SETUP-GUIDE.md` for TLS specifics.
- `docs/guides/AZURE-AD-MOBILE-ACCESS.md` for mobile login tips.

Happy shipping! 🚀
