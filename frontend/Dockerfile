# frontend/Dockerfile

# --- Multi-stage build for smaller production image ---

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build Nuxt.js application for production
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/frontend

# Copy only necessary files from the builder stage
COPY --from=builder /app/frontend/.output ./server
COPY --from=builder /app/frontend/node_modules ./node_modules

# Expose the application port
EXPOSE 3000

# Command to run the Nuxt.js server
CMD ["node", "./server/index.mjs"]