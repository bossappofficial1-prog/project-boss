# Multi-stage build for consumer service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from consumer directory (build context is project root)
COPY consumer/package*.json ./

# Install dependencies
RUN npm install --no-package-lock

# Copy consumer source code
COPY consumer/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install OpenSSL for libraries that might need it
RUN apk add --no-cache openssl libstdc++ ca-certificates

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S consumer -u 1001

# Change ownership of the app directory
RUN chown -R consumer:nodejs /app
USER consumer

# Expose port if needed
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Consumer service is healthy')" || exit 1

# Start the application
CMD ["node", "dist/worker-manager.js"]
