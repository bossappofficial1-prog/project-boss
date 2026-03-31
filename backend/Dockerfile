# --- Stage 1: Builder (Kompilasi TypeScript) ---
FROM node:20-alpine AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

# --- Stage 2: Prod Dependencies ---
FROM node:20-alpine AS prod-deps
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev \
    && npx prisma generate \
    && npm cache clean --force \
    && rm -rf /root/.npm /tmp/*

# --- Stage 3: Runner (Image Final) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    font-noto-emoji

COPY package*.json ./

COPY --from=prod-deps /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/prisma ./prisma

# Buat folder uploads dengan permission yang benar
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

VOLUME ["/app/uploads"]

EXPOSE 1234

CMD ["node", "dist/src/index.js"]