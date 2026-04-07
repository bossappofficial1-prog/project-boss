# --- Stage 1: Builder (Build + prune production deps) ---
FROM oven/bun:1-alpine AS builder
WORKDIR /app

ARG DATABASE_URL
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV DATABASE_URL=$DATABASE_URL

COPY package.json bun.lockb* ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate \
    && bun run build \
    && rm -rf node_modules \
    && bun install --production --frozen-lockfile \
    && bunx prisma generate

# --- Stage 2: Runner (Image Final) ---
FROM oven/bun:1-alpine AS runner
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

COPY package.json bun.lockb* ./

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/prisma ./prisma

# Buat folder uploads dengan permission yang benar
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

VOLUME ["/app/uploads"]

EXPOSE 1234

CMD ["bun", "dist/src/index.js"]