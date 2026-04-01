# --- Stage 1: Builder (Build + prune production deps) ---
FROM node:20-alpine AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate \
    && npm run build \
    && npm prune --omit=dev \
    && npm cache clean --force \
    && rm -rf /root/.npm /tmp/*

# --- Stage 2: Runner (Image Final) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ARG INSTALL_CHROMIUM=true
RUN if [ "$INSTALL_CHROMIUM" = "true" ]; then \
      apk add --no-cache \
        chromium \
        nss \
        freetype \
        harfbuzz \
        ttf-freefont \
        font-noto-emoji; \
    fi

COPY package*.json ./

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/prisma ./prisma

# Buat folder uploads dengan permission yang benar
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

VOLUME ["/app/uploads"]

EXPOSE 1234

CMD ["node", "dist/src/index.js"]