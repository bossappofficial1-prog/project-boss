# --- Stage 1: Build and compile ---
FROM node:20-alpine AS builder
WORKDIR /app/backend

# Copy file package dulu untuk caching layer yang optimal
COPY package*.json ./

# Install semua dependensi (termasuk devDependencies untuk build TypeScript)
RUN npm ci

# Copy seluruh source code
COPY . .

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Production runtime ---
FROM node:20-alpine AS runner
WORKDIR /app/backend

# Deklarasi ENV
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
# lebih aman daripada di-hardcode di Dockerfile)

# Install dependensi sistem yang dibutuhkan Prisma di Alpine
RUN apk add --no-cache openssl libstdc++ ca-certificates

# Copy package.json saja
COPY package*.json ./

# Install HANYA dependensi production (ukuran sangat kecil)
RUN npm ci --omit=dev

RUN npm install -g prisma

# COPY file hasil build dan folder penting dari stage builder
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/prisma ./prisma

# agar kita tidak perlu membawa seluruh node_modules builder
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma ./node_modules/@prisma

EXPOSE 1234

# CMD dijalankan saat container start.
CMD sh -c 'npx prisma migrate deploy && \
    if [ "$NODE_ENV" = "development" ]; then \
        if [ "$FORCE_RESEED" = "true" ]; then \
            echo "🔄 Force reseeding enabled..."; \
            npm run db:seed -- --force; \
        else \
            echo "🌱 Normal seeding (skip if data exists)..."; \
            npm run db:seed; \
        fi; \
    fi && node dist/index.js'