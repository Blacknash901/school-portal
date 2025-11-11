# Multi-stage build for optimized production image
# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Accept build arguments for React environment variables
ARG REACT_APP_MSAL_CLIENT_ID
ARG REACT_APP_MSAL_TENANT_ID
ARG REACT_APP_AZURE_CLIENT_ID
ARG REACT_APP_AZURE_TENANT_ID
ARG REACT_APP_REDIRECT_URI
ARG REACT_APP_S3_BUCKET_NAME
ARG REACT_APP_S3_REGION
ARG REACT_APP_S3_ACCESS_KEY_ID
ARG REACT_APP_S3_SECRET_ACCESS_KEY
ARG REACT_APP_WORDPRESS_FEED_URL
ARG REACT_APP_SENTRY_DSN
ARG REACT_APP_SENTRY_ENVIRONMENT
ARG REACT_APP_ENABLE_SENTRY
ARG REACT_APP_GOOGLE_CLIENT_ID

# Make them available during build
ENV REACT_APP_MSAL_CLIENT_ID=$REACT_APP_MSAL_CLIENT_ID
ENV REACT_APP_MSAL_TENANT_ID=$REACT_APP_MSAL_TENANT_ID
ENV REACT_APP_AZURE_CLIENT_ID=$REACT_APP_AZURE_CLIENT_ID
ENV REACT_APP_AZURE_TENANT_ID=$REACT_APP_AZURE_TENANT_ID
ENV REACT_APP_REDIRECT_URI=$REACT_APP_REDIRECT_URI
ENV REACT_APP_S3_BUCKET_NAME=$REACT_APP_S3_BUCKET_NAME
ENV REACT_APP_S3_REGION=$REACT_APP_S3_REGION
ENV REACT_APP_S3_ACCESS_KEY_ID=$REACT_APP_S3_ACCESS_KEY_ID
ENV REACT_APP_S3_SECRET_ACCESS_KEY=$REACT_APP_S3_SECRET_ACCESS_KEY
ENV REACT_APP_WORDPRESS_FEED_URL=$REACT_APP_WORDPRESS_FEED_URL
ENV REACT_APP_SENTRY_DSN=$REACT_APP_SENTRY_DSN
ENV REACT_APP_SENTRY_ENVIRONMENT=$REACT_APP_SENTRY_ENVIRONMENT
ENV REACT_APP_ENABLE_SENTRY=$REACT_APP_ENABLE_SENTRY
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

# Build the app
RUN npm run build

# Stage 2: Production image with Node.js server
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built app from builder
COPY --from=builder /app/build ./build

# Copy server files
COPY server-https.js ./
COPY server.js ./

# Create certs directory (certificates will be mounted as volume)
RUN mkdir -p /app/certs

# Expose ports
EXPOSE 3000 3443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start the HTTPS server
CMD ["node", "server-https.js"]

