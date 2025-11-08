# Stage 1: Install dependencies only
FROM node:20-alpine AS deps
WORKDIR /app/frontend-customer
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

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
ARG NEXT_PUBLIC_DASHBOARD_LOGIN_URL=http://localhost:3010/login
ARG NEXT_PUBLIC_DASHBOARD_REGISTER_URL=http://localhost:3010/register

ENV NEXT_PUBLIC_REMOTE_PATTERNS=$NEXT_PUBLIC_REMOTE_PATTERNS
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_PREFIX=$NEXT_PUBLIC_API_PREFIX
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NODE_ENV=$NODE_ENV
ENV DATABASE_URL=$DATABASE_URL
ENV SITE_URL=$SITE_URL
ENV NEXT_PUBLIC_DASHBOARD_LOGIN_URL=$NEXT_PUBLIC_DASHBOARD_LOGIN_URL
ENV NEXT_PUBLIC_DASHBOARD_REGISTER_URL=$NEXT_PUBLIC_DASHBOARD_REGISTER_URL

# Debug: Print environment variables during build
RUN echo "NEXT_PUBLIC_API_URL during build: $NEXT_PUBLIC_API_URL"

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app/frontend-customer
ENV NODE_ENV=production

# Copy only necessary files
COPY --from=builder /app/frontend-customer/.next ./.next
COPY --from=builder /app/frontend-customer/public ./public
COPY --from=builder /app/frontend-customer/package.json ./
COPY --from=builder /app/frontend-customer/node_modules ./node_modules
COPY --from=builder /app/frontend-customer/next.config.ts ./
COPY --from=builder /app/frontend-customer/next-env.d.ts ./
COPY --from=builder /app/frontend-customer/tsconfig.json ./
COPY --from=builder /app/frontend-customer/src ./src

EXPOSE 3000
CMD ["npm", "start"]
