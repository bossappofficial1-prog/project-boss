# Use the official Node.js 18 Alpine image as the base
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app/dashboard

ARG NEXT_PUBLIC_API_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set the working directory
WORKDIR /app/dashboard

# Copy package.json and package-lock.json
COPY --from=base /app/dashboard/package*.json ./

# Copy the built application from the base stage
COPY --from=base /app/dashboard/.next ./.next
COPY --from=base /app/dashboard/public ./public

# Install only production dependencies
RUN npm ci --only=production

# Expose the port the app runs on
EXPOSE 3010

# Start the application
CMD ["npm", "start"]