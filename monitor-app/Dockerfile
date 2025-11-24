# Build stage for React frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./

# Build the frontend
RUN npm run build

# Build stage for Node.js backend
FROM node:18-alpine AS backend-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend source
COPY server ./server

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend dependencies and code
COPY --from=backend-build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-build --chown=nodejs:nodejs /app/server ./server
COPY --chown=nodejs:nodejs package*.json ./

# Copy built frontend
COPY --from=frontend-build --chown=nodejs:nodejs /app/dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server/index.js"]
