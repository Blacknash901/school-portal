# Self-Hosted Runner Setup Guide

This guide explains how to set up a GitHub Actions self-hosted runner on your personal server to deploy without needing a public IP.

## 🎯 Why Self-Hosted Runner?

**Problem:** GitHub Actions can't connect to servers without public IPs.

**Solution:** Run the GitHub Actions runner on your personal server (or same network). The runner connects to GitHub, and GitHub sends jobs to the runner. The runner then executes Ansible locally.

**Benefits:**
- ✅ No public IP needed
- ✅ No SSH from GitHub to server
- ✅ Works with local/private networks
- ✅ Full GitHub Actions integration
- ✅ Simpler than Jenkins

---

## 📋 Prerequisites

- Personal server with internet access (outbound)
- SSH access to the server
- Ubuntu/Debian Linux (or similar)
- User with sudo privileges

---

## 🚀 Setup Steps

### Step 1: Create Runner in GitHub

1. **Go to your GitHub repository**
   - Navigate to: **Settings → Actions → Runners**
   - Click **New self-hosted runner**

2. **Select Operating System**
   - Choose: **Linux** (or your server OS)

3. **Copy the setup commands**
   - GitHub will show commands like:
   ```bash
   # Create a folder
   mkdir actions-runner && cd actions-runner
   
   # Download the latest runner package
   curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
   
   # Extract the installer
   tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
   
   # Configure the runner
   ./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
   ```

### Step 2: Install Runner on Your Server

**SSH into your server:**

```bash
ssh user@your-server-ip
```

**Run the setup commands from GitHub:**

```bash
# Create runner directory
mkdir actions-runner && cd actions-runner

# Download runner (use the URL from GitHub)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure (use your token from GitHub)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
```

**During configuration, you'll be asked:**
- **Runner name:** `production-runner` (or any name)
- **Labels:** Leave default or add custom labels
- **Work folder:** Default is fine (`_work`)

### Step 3: Install Runner as a Service

**Install as a systemd service (runs automatically):**

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

**Verify it's running:**

```bash
sudo systemctl status actions.runner.*.service
```

### Step 4: Verify Runner in GitHub

1. **Go back to GitHub**
   - Navigate to: **Settings → Actions → Runners**
   - You should see your runner listed as **"Idle"** (green)

2. **Test the runner**
   - Go to **Actions** tab
   - Run the **"Deploy to Personal Server"** workflow manually
   - Check if it uses your self-hosted runner

---

## 🔧 Configuration Options

### Runner User

**Option 1: Run as current user (recommended)**
- Runner runs as the user who installed it
- Ansible can use `ansible_connection: local`
- No SSH needed

**Option 2: Run as specific user**
```bash
# Install as specific user
sudo ./svc.sh install YOUR_USERNAME
```

### Runner Labels

You can add custom labels to identify your runner:

```bash
./config.sh --url https://github.com/USER/REPO --token TOKEN --labels production,self-hosted
```

Then use in workflow:
```yaml
runs-on: [self-hosted, production]
```

### Runner Work Directory

Default is `_work` in the runner directory. You can change it:

```bash
./config.sh --url ... --work _work
```

---

## 📝 Workflow Configuration

The workflow (`.github/workflows/deploy-self-hosted.yml`) is already configured to use:

```yaml
runs-on: self-hosted
```

And uses `ansible_connection: local` since the runner is on the same server.

---

## 🔄 Managing the Runner

### Start/Stop Runner

```bash
# Start
sudo ./svc.sh start

# Stop
sudo ./svc.sh stop

# Restart
sudo ./svc.sh restart

# Status
sudo ./svc.sh status
```

### Update Runner

```bash
cd actions-runner

# Stop service
sudo ./svc.sh stop

# Download latest
./bin/Runner.Listener configure --remove
./config.sh --url https://github.com/USER/REPO --token NEW_TOKEN

# Start service
sudo ./svc.sh start
```

### Remove Runner

```bash
cd actions-runner

# Stop and uninstall service
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Remove from GitHub
./config.sh remove --token YOUR_TOKEN

# Delete directory
cd ..
rm -rf actions-runner
```

---

## 🛠️ Troubleshooting

### Runner Not Appearing in GitHub

**Problem:** Runner doesn't show up in GitHub

**Solution:**
- Check internet connection on server
- Verify token is correct
- Check firewall allows outbound HTTPS (port 443)
- Review runner logs: `cd actions-runner && ./run.sh` (run manually to see errors)

### Runner Offline

**Problem:** Runner shows as offline in GitHub

**Solution:**
```bash
# Check service status
sudo systemctl status actions.runner.*.service

# Check logs
sudo journalctl -u actions.runner.*.service -f

# Restart service
sudo ./svc.sh restart
```

### Ansible Not Found

**Problem:** Workflow fails with "ansible: command not found"

**Solution:**
- The workflow installs Ansible automatically
- Or install manually: `sudo apt-get install ansible`
- Or: `pip3 install ansible`

### Permission Denied

**Problem:** Ansible can't run sudo commands

**Solution:**
- Ensure runner user has sudo access
- Check sudoers: `sudo visudo`
- Add: `runner_user ALL=(ALL) NOPASSWD: ALL`

### Workflow Not Using Self-Hosted Runner

**Problem:** Workflow still uses GitHub-hosted runner

**Solution:**
- Verify workflow uses `runs-on: self-hosted`
- Check runner is online in GitHub
- Ensure runner has correct labels (if using labels)

---

## 🔒 Security Considerations

### Runner Security

- **Runner has access to your server** - Only use trusted repositories
- **Runner can access secrets** - GitHub secrets are available to runner
- **Runner runs as service user** - Ensure proper permissions

### Best Practices

1. **Use dedicated user** for runner (not root)
2. **Limit sudo access** to what's needed
3. **Monitor runner logs** regularly
4. **Keep runner updated** for security patches
5. **Use labels** to control which workflows use which runners

### Network Security

- Runner only needs **outbound HTTPS** (port 443) to GitHub
- No inbound connections needed
- Works behind NAT/firewall

---

## 📊 Comparison: Self-Hosted Runner vs Jenkins

| Feature | Self-Hosted Runner | Jenkins |
|---------|-------------------|---------|
| **Setup Complexity** | Low | Medium |
| **GitHub Integration** | ✅ Native | ❌ Requires plugins |
| **Maintenance** | Low | Medium |
| **Resource Usage** | Low | Higher |
| **Learning Curve** | Low | Medium |
| **Best For** | Simple deployments | Complex CI/CD pipelines |

**Recommendation:** Use self-hosted runner for simple deployments. Use Jenkins if you need complex pipelines, multiple projects, or advanced features.

---

## 🎯 Quick Reference

### Install Runner
```bash
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/USER/REPO --token TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

### Check Status
```bash
sudo systemctl status actions.runner.*.service
```

### View Logs
```bash
sudo journalctl -u actions.runner.*.service -f
```

### Restart Runner
```bash
sudo ./svc.sh restart
```

---

## 🔗 Related Documentation

- [GitHub Actions Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Runner Configuration](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)

---

## 💡 Tips

1. **Use labels** to organize multiple runners
2. **Monitor runner health** regularly
3. **Keep runner updated** for security
4. **Use dedicated user** for better security
5. **Test workflows** before production use

---

**Need Help?** Check the troubleshooting section or GitHub Actions runner documentation.

