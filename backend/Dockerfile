# --- Stage 1: Builder (Kompilasi TypeScript) ---
FROM node:20-alpine AS builder
WORKDIR /app

# Mencegah download Chromium di tahap build
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY prisma ./prisma/

# Install SEMUA dependencies (termasuk dev) untuk proses build
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

COPY . .

RUN npm run build

# --- Stage 2: Prod Dependencies (Install bersih khusus produksi) ---
FROM node:20-alpine AS prod-deps
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

RUN npm cache clean --force && rm -rf /root/.npm

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

EXPOSE 1234

CMD ["node", "dist/src/index.js"]