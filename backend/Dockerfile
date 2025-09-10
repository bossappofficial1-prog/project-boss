# --- Multi-stage build for smaller production image ---
# Stage 1: Build and compile
FROM node:20-alpine AS builder

WORKDIR /app/backend

ARG NODE_ENV=production
ARG DATABASE_URL
ARG CLIENT_URL

ENV NODE_ENV=$NODE_ENV
ENV DATABASE_URL=$DATABASE_URL
ENV CLIENT_URL=$CLIENT_URL

COPY package*.json ./
RUN npm install

COPY . .

# Prisma akan menghasilkan binary engine untuk target yang ditentukan di schema.prisma
RUN npx prisma generate

RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/backend

COPY --from=builder /app/backend/package*.json ./
# COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/prisma ./prisma

# Pastikan dependensi OpenSSL terinstal di Alpine
# Ini untuk library yang dibutuhkan runtime Prisma Engine
RUN apk add --no-cache openssl libstdc++ ca-certificates

# Hanya install Prisma CLI sebagai runtime dependency (tidak perlu generate lagi di sini)
# RUN npm install prisma --omit=dev --no-fund --no-audit --ignore-scripts
RUN npm install --omit=dev
RUN npm install ts-node

EXPOSE 4444
CMD sh -c 'if [ "$NODE_ENV" = "development" ]; then npx prisma migrate deploy && npm run db:seed; fi && npm start'