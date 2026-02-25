# Use the official Node.js 18 Alpine image as the base
FROM node:18-alpine AS base

RUN apk add --no-cache libc6-compat

# Set the working directory
WORKDIR /app/dashboard

ARG NEXT_PUBLIC_REMOTE_PATTERNS
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_APP_URL
ARG JWT_SECRET

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_REMOTE_PATTERNS=${NEXT_PUBLIC_REMOTE_PATTERNS}

# Copy package.json dan package-lock.json terlebih dahulu untuk caching instalasi
COPY package*.json ./

# Jika sering gagal, ganti kembali ke npm i
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# --- Production stage ---
FROM node:18-alpine AS production

WORKDIR /app/dashboard

# Copy package files
COPY --from=base /app/dashboard/package*.json ./

# Copy the built application from the base stage
COPY --from=base /app/dashboard/.next ./.next
COPY --from=base /app/dashboard/public ./public
# Copy node_modules is needed unless you use Next.js standalone output feature
COPY --from=base /app/dashboard/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3010

# Start the application
CMD ["npm", "start"]