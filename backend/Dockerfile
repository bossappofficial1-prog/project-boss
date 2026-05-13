# --- Dependencies ---
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile

# --- Builder ---
FROM oven/bun:1-alpine AS builder
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bunx prisma generate
RUN bun run build

# --- Production Dependencies ---
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --production --frozen-lockfile

# --- Runner ---
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

COPY --from=prod-deps /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads && chmod 777 /app/uploads

VOLUME ["/app/uploads"]

EXPOSE 1234

CMD ["bun", "dist/src/index.js"]