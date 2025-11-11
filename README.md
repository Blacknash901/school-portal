# School Portal

A modern, secure web portal for educational institutions with Azure AD authentication, role-based access control, and a beautiful dark/light theme interface.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Access at `http://localhost:3000`

### Environment Setup

1. Copy `env.example` to `.env`
2. Fill in your Azure AD credentials and other configuration
3. See `env.example` for all available options

## 📁 Project Structure

```
school-portal/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── auth/               # MSAL authentication
│   ├── data/               # App definitions & role mappings
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── Dockerfile              # Production Docker image
├── server.js               # Development server
├── server-https.js         # Production HTTPS server
└── env.example             # Environment variables template
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

Copy `env.example` to `.env` and configure:

```bash
# Azure AD Authentication
REACT_APP_MSAL_CLIENT_ID=your-client-id
REACT_APP_MSAL_TENANT_ID=your-tenant-id
REACT_APP_REDIRECT_URI=http://localhost:3000

# Optional: AWS S3 (for logging)
REACT_APP_S3_BUCKET_NAME=your-bucket
REACT_APP_S3_REGION=us-east-1

# Optional: Sentry (error tracking)
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

## 🐳 Docker

### Build

```bash
docker build -t school-portal .
```

### Run

```bash
docker run -d \
  -p 3000:3000 \
  -p 3443:3443 \
  --env-file .env \
  school-portal
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 🏗️ Build

```bash
# Build for production
npm run build
```

## 📦 CI/CD

This project includes GitHub Actions workflows that automatically:

- ✅ Run tests on pull requests
- ✅ Build and push Docker images on merge to main
- ✅ Support multi-architecture builds (ARM64 + AMD64)

See `.github/workflows/ci-cd.yml` for details.

### GitHub Secrets Required

Configure these secrets in GitHub repository settings:

**Required:**

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `REACT_APP_MSAL_CLIENT_ID` - Azure AD client ID
- `REACT_APP_MSAL_TENANT_ID` - Azure AD tenant ID
- `REACT_APP_AZURE_CLIENT_ID` - Azure client ID
- `REACT_APP_AZURE_TENANT_ID` - Azure tenant ID
- `REACT_APP_REDIRECT_URI` - Production redirect URI

**Optional:**

- `REACT_APP_S3_BUCKET_NAME` - S3 bucket for logging
- `REACT_APP_S3_REGION` - AWS region
- `REACT_APP_S3_ACCESS_KEY_ID` - AWS access key
- `REACT_APP_S3_SECRET_ACCESS_KEY` - AWS secret key
- `REACT_APP_WORDPRESS_FEED_URL` - WordPress feed URL
- `REACT_APP_SENTRY_DSN` - Sentry DSN
- `REACT_APP_ENABLE_SENTRY` - Enable Sentry (true/false)
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Support

For issues or questions, please open an issue on GitHub.

---

**Version:** 1.0.11  
**Last Updated:** November 2024
