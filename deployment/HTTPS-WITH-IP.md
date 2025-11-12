# Deploy with HTTPS on IP Address (34.234.31.7)

## ✅ Yes! You can use `https://34.234.31.7:3443`

This guide shows how to deploy with HTTPS even before DNS is configured.

---

## 🔐 What You Get

- **✅ Encrypted HTTPS connection**
- **✅ Secure data transmission**
- **⚠️ Self-signed certificate** (browser warning expected)
- **✅ Works without domain/DNS**

---

## 🚀 Quick Deploy with HTTPS

### Step 1: Build with HTTPS Redirect URI

```bash
cd /Users/jmadriz/school-portal

# Login to Docker Hub
docker login

# Build for HTTPS on IP
./build-production.sh 1.0.5 ip

# This builds with: https://34.234.31.7:3443
```

### Step 2: Configure Azure AD

Add redirect URI: **`https://34.234.31.7:3443`**

1. Go to: https://portal.azure.com
2. **Azure Active Directory** → **App registrations**
3. Select app: `4a53daad-6722-4d4e-ad09-318c51ad4c50`
4. **Authentication** → **Web** → **Add URI:**
   ```
   https://34.234.31.7:3443
   ```
5. **Save**

⚠️ **Note:** Azure AD may warn about HTTPS on IP. This is fine for testing/temporary use.

### Step 3: Deploy

The playbook is already configured for HTTPS! Just run:

```bash
cd deployment/ansible

# Verify settings in inventory-production.yml:
# use_ip: true
# use_https: true

# Deploy!
ansible-playbook -i inventory-production.yml playbook-production.yml
```

**What happens:**

1. ✅ Generates self-signed SSL certificate on server
2. ✅ Mounts certificates into containers
3. ✅ Starts HTTPS server on port 3443
4. ✅ Configures firewall for port 3443

### Step 4: Access & Test

1. Open: `https://34.234.31.7:3443`
2. **Browser will show security warning** - Click "Advanced" → "Proceed"
3. Click "Sign in with Microsoft"
4. Should work! 🎉

---

## 🔍 Understanding the Browser Warning

### Why the Warning?

The certificate is **self-signed** (not from a trusted Certificate Authority like Let's Encrypt).

### Is it Safe?

**Yes**, the connection is still encrypted! The warning just means:

- The certificate isn't verified by a CA
- Browser can't verify the server's identity

### For Production

Once DNS is configured, you'll get a proper Let's Encrypt certificate (no warnings).

---

## 🆚 HTTP vs HTTPS Comparison

| Feature             | HTTP (Port 3000)          | HTTPS (Port 3443)          |
| ------------------- | ------------------------- | -------------------------- |
| **URL**             | `http://34.234.31.7:3000` | `https://34.234.31.7:3443` |
| **Encryption**      | ❌ No                     | ✅ Yes                     |
| **Browser Warning** | ❌ No                     | ⚠️ Yes (self-signed)       |
| **Security**        | Low                       | High                       |
| **Azure AD**        | Warns about HTTP          | Accepts HTTPS              |
| **Recommended**     | Testing only              | ✅ Better choice           |

**Recommendation:** Use HTTPS even with the browser warning!

---

## 🔧 Configuration Details

### Inventory Settings

```yaml
# deployment/ansible/inventory-production.yml
vars:
  use_ip: true # Using IP instead of domain
  use_https: true # Use HTTPS (generates self-signed cert)
```

### Build Command

```bash
# HTTPS on IP (default now)
./build-production.sh 1.0.5 ip

# If you want HTTP instead (not recommended)
./build-production.sh 1.0.5 ip-http
```

### Ports Used

- **3443** - HTTPS (NodePort 30443)
- **3000** - HTTP redirect (optional)

---

## 🔄 Migration Paths

### Current: IP + HTTPS

```
https://34.234.31.7:3443
└─ Self-signed certificate
└─ Browser warning
└─ Encrypted connection ✅
```

### Future: Domain + Let's Encrypt

```
https://portal.cecre.net
└─ Let's Encrypt certificate
└─ No browser warning ✅
└─ Fully trusted ✅
```

---

## 📋 Checklist

Before deploying:

- [ ] Updated SSH key in `inventory-production.yml`
- [ ] Logged into Docker Hub
- [ ] Built image: `./build-production.sh 1.0.5 ip`
- [ ] Added redirect URI to Azure AD: `https://34.234.31.7:3443`
- [ ] Verified `use_https: true` in inventory
- [ ] AWS Security Group allows port 3443

After deploying:

- [ ] Can access: `https://34.234.31.7:3443`
- [ ] Accepted browser security warning
- [ ] Microsoft login works
- [ ] Apps display correctly

---

## 🆘 Troubleshooting

### Can't access https://34.234.31.7:3443

**Check firewall:**

```bash
ssh -i ~/.ssh/your-key.pem ubuntu@34.234.31.7
sudo ufw status

# Should show:
# 3443/tcp                   ALLOW       Anywhere
# 30443/tcp                  ALLOW       Anywhere
```

**Check AWS Security Group:**

- Port 3443, Source: 0.0.0.0/0

### Certificate error won't let me proceed

**Different browsers:**

- **Chrome/Edge:** Click "Advanced" → "Proceed to 34.234.31.7"
- **Firefox:** Click "Advanced" → "Accept the Risk and Continue"
- **Safari:** Click "Show Details" → "visit this website"

### Login fails after accepting certificate

1. Check Azure AD redirect URI: `https://34.234.31.7:3443`
2. Clear browser cache and cookies
3. Check pod logs for MSAL configuration

### Want to switch back to HTTP

Edit `inventory-production.yml`:

```yaml
use_https: false # Change from true
```

Then rebuild and redeploy.

---

## 🎯 Summary

| Setting             | Value                            |
| ------------------- | -------------------------------- |
| **Build Command**   | `./build-production.sh 1.0.5 ip` |
| **Access URL**      | `https://34.234.31.7:3443`       |
| **Azure AD URI**    | `https://34.234.31.7:3443`       |
| **Certificate**     | Self-signed (auto-generated)     |
| **Browser Warning** | Expected - click through         |
| **Security**        | ✅ Encrypted connection          |

---

## 💡 Recommendation

**Use HTTPS even with browser warning!**

Benefits:

- ✅ Encrypted data transmission
- ✅ Better security
- ✅ Azure AD prefers HTTPS
- ✅ Same setup as production (just different cert)
- ✅ Easy migration when DNS is ready

The browser warning is cosmetic - the connection is still secure!

---

For more details, see:

- `DEPLOYMENT-READY.md` - Complete deployment guide
- `DEPLOY-WITH-IP.md` - IP-based deployment details
- `CHECKLIST.md` - Step-by-step checklist
