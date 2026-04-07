# Stage 1: Install dependencies only
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/frontend-customer
COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app/frontend-customer
COPY --from=deps /app/frontend-customer/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_REMOTE_PATTERNS
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_PREFIX
ARG NEXT_PUBLIC_SOCKET_URL
ARG NODE_ENV=production
ARG DATABASE_URL
ARG SITE_URL
ARG NEXT_PUBLIC_VAPID_KEY
ARG NEXT_PUBLIC_DASHBOARD_LOGIN_URL=http://localhost:3010/login
ARG NEXT_PUBLIC_DASHBOARD_REGISTER_URL=http://localhost:3010/register

ENV NEXT_PUBLIC_REMOTE_PATTERNS=$NEXT_PUBLIC_REMOTE_PATTERNS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_PREFIX=$NEXT_PUBLIC_API_PREFIX
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NODE_ENV=$NODE_ENV
ENV DATABASE_URL=$DATABASE_URL
ENV SITE_URL=$SITE_URL
ENV NEXT_PUBLIC_VAPID_KEY=$NEXT_PUBLIC_VAPID_KEY
ENV NEXT_PUBLIC_DASHBOARD_LOGIN_URL=$NEXT_PUBLIC_DASHBOARD_LOGIN_URL
ENV NEXT_PUBLIC_DASHBOARD_REGISTER_URL=$NEXT_PUBLIC_DASHBOARD_REGISTER_URL

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app/frontend-customer

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Bikin user non-root untuk alasan keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set izin akses folder statis
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Salin standalone build dan static files
COPY --from=builder --chown=nextjs:nodejs /app/frontend-customer/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend-customer/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend-customer/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]