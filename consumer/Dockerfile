# Multi-stage build for consumer service
FROM node:20-alpine AS builder

ARG SMTP_HOST=smtp.ethereal.email
ARG SMTP_PORT=587
ARG SMTP_USER=margarete.conroy74@ethereal.email
ARG SMTP_PASS=khesc9qqxTSTe4BSz7
ARG SMTP_FROM

ENV SMTP_HOST=$SMTP_HOST
ENV SMTP_PORT=$SMTP_PORT
ENV SMTP_USER=$SMTP_USER
ENV SMTP_PASS=$SMTP_PASS
ENV SMTP_FROM=$SMTP_FROM

# Set working directory
WORKDIR /app/consumer

# Copy package files (build context is consumer directory)
COPY package*.json ./

# Install dependencies
RUN npm install --no-package-lock

# Copy source code
COPY . ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app/consumer

# Install OpenSSL for libraries that might need it
RUN apk add --no-cache openssl libstdc++ ca-certificates

# Copy package files
COPY --from=builder /app/consumer/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/consumer/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/consumer/dist ./dist

# Copy other necessary files
COPY --from=builder /app/consumer/src ./src
COPY --from=builder /app/consumer/tsconfig.json ./

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
