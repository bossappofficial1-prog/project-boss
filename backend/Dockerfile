# --- Stage 1: Build and compile ---
FROM node:20-alpine AS builder
WORKDIR /app/backend

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .
# Generate Prisma Client ke dalam node_modules
RUN npx prisma generate
# Build kode TypeScript
RUN npm run build
RUN npm prune --omit=dev

# --- Stage 2: Production runtime ---
FROM node:20-alpine AS runner
WORKDIR /app/backend

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add --no-cache \
    openssl libstdc++ ca-certificates \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    font-noto-emoji

COPY package*.json ./

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/templates ./templates
COPY --from=builder /app/backend/prisma ./prisma

RUN rm -f .env prisma/.env

EXPOSE 1234


CMD ["node", "dist/src/index.js"]