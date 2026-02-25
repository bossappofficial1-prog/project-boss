# --- Stage 1: Build and compile ---
FROM node:20-alpine AS builder
WORKDIR /app/backend

# Skip download Chrome bawaan Puppeteer agar build cepat & tidak bengkak
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Production runtime ---
FROM node:20-alpine AS runner
WORKDIR /app/backend

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Beritahu Puppeteer lokasi Chromium bawaan Alpine
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install dependensi Prisma + Chromium + Font untuk cetak PDF
RUN apk add --no-cache \
    openssl libstdc++ ca-certificates \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    font-noto-emoji

COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --omit=dev
RUN npm install -g prisma

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/templates ./templates
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma ./node_modules/@prisma

RUN rm -f .env prisma/.env

EXPOSE 1234

CMD node dist/src/index.js