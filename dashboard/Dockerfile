# Stage 1: Install dependencies only
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/dashboard
COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app/dashboard
COPY --from=deps /app/dashboard/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_REMOTE_PATTERNS
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CUSTOMER_URL
ARG NODE_ENV=production

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_CUSTOMER_URL=${NEXT_PUBLIC_CUSTOMER_URL}
ENV NEXT_PUBLIC_REMOTE_PATTERNS=${NEXT_PUBLIC_REMOTE_PATTERNS}
ENV NODE_ENV=${NODE_ENV}

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app/dashboard

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Salin standalone build dan static files
COPY --from=builder --chown=nextjs:nodejs /app/dashboard/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dashboard/.next/static ./.next/static

# Gunakan user non-root
USER nextjs

EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

# Jalankan server
CMD ["node", "server.js"]