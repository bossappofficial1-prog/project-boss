# Stage 1: Build and compile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend files first to leverage Docker layer caching
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy consumer files
COPY consumer/package*.json ./consumer/
RUN cd consumer && npm install --no-package-lock

# Copy all source code
COPY . .

# Generate Prisma client based on schema in backend
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# Build both backend and consumer
RUN npm --prefix backend run build
RUN npm --prefix consumer run build

# --- Multi-stage build for smaller production image ---
# Stage 1: Build and compile
FROM node:20-alpine AS consumer_builder

WORKDIR /app/consumer

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS consumer_runner

WORKDIR /app/consumer

# Copy only necessary files from the builder stage
COPY --from=consumer_builder /app/consumer/package*.json ./
COPY --from=consumer_builder /app/consumer/node_modules ./node_modules
COPY --from=consumer_builder /app/consumer/dist ./dist

# Install OpenSSL for libraries that might need it (like Prisma's engine in the future)
RUN apk add --no-cache openssl libstdc++ ca-certificates

# No need to install dev dependencies in production
# RUN npm install --omit=dev --no-fund --no-audit

CMD ["npm", "start"]
