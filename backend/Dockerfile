# --- Multi-stage build for smaller production image ---
# Stage 1: Build and compile
FROM node:20-alpine AS builder

WORKDIR /app/backend

ARG NODE_ENV=production
ARG DATABASE_URL
ARG CLIENT_URL
ARG SMTP_HOST=smtp.ethereal.email
ARG SMTP_PORT=587
ARG SMTP_USER=margarete.conroy74@ethereal.email
ARG SMTP_PASS=khesc9qqxTSTe4BSz7
ARG SMTP_FROM

ENV NODE_ENV=$NODE_ENV
ENV DATABASE_URL=$DATABASE_URL
ENV CLIENT_URL=$CLIENT_URL
ENV SMTP_HOST=$SMTP_HOST
ENV SMTP_PORT=$SMTP_PORT
ENV SMTP_USER=$SMTP_USER
ENV SMTP_PASS=$SMTP_PASS
ENV SMTP_FROM=$SMTP_FROM

COPY package*.json ./

# Increase npm timeout and registry settings and install all deps (including dev)
# Use `npm ci --include=dev` for reproducible installs and to ensure devDependencies
# (typescript, @types/*, etc.) are available during the build stage.
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm ci --include=dev

COPY . .

# Prisma akan menghasilkan binary engine untuk target yang ditentukan di schema.prisma
RUN npx prisma generate

RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/backend

COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/prisma ./prisma

# Pastikan dependensi OpenSSL terinstal di Alpine
# Ini untuk library yang dibutuhkan runtime Prisma Engine
RUN apk add --no-cache openssl libstdc++ ca-certificates

# For development, copy node_modules from builder to avoid reinstall
# For production, install only production dependencies
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN if [ "$NODE_ENV" = "development" ]; then \
        echo "Development mode: copying node_modules from builder"; \
    else \
        echo "Production mode: installing production dependencies"; \
        npm config set fetch-retry-mintimeout 20000 && \
        npm config set fetch-retry-maxtimeout 120000 && \
        npm config set fetch-timeout 300000 && \
        npm install --omit=dev; \
    fi

# Copy node_modules from builder for development
COPY --from=builder /app/backend/node_modules ./node_modules

EXPOSE 1234
# Smart seeding: use FORCE_RESEED env var to control
CMD sh -c 'npx prisma migrate deploy && npx prisma generate && \
    if [ "$NODE_ENV" = "development" ]; then \
        if [ "$FORCE_RESEED" = "true" ]; then \
            echo "🔄 Force reseeding enabled..."; \
            npm run db:seed -- --force; \
        else \
            echo "🌱 Normal seeding (skip if data exists)..."; \
            npm run db:seed; \
        fi; \
    fi && npm start'