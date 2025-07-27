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

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

COPY --from=builder /app/consumer/package*.json ./consumer/
COPY --from=builder /app/consumer/node_modules ./consumer/node_modules
COPY --from=builder /app/consumer/dist ./consumer/dist

# Install production dependencies for consumer
RUN cd consumer && npm install --omit=dev --no-fund --no-audit

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libstdc++ ca-certificates

EXPOSE 4445
CMD ["npm", "start", "--prefix", "consumer"]
