# --- Multi-stage build for smaller production image ---

# Stage 1: Build and compile
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Copy package.json and install dependencies (leveraging Docker cache)
COPY package*.json ./
RUN npm install

# Copy all application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Copy only necessary files from the builder stage
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

# Install Prisma binary for runtime (if not already in node_modules from builder)
# This step ensures Prisma Engines are present in the final image for `prisma migrate deploy`
# The --omit=dev prevents dev dependencies, and --skip-generate prevents regenerating client again.
RUN npm install prisma --omit=dev --no-fund --no-audit --ignore-scripts

# Expose the application port
EXPOSE 4444

# Command to run the application
CMD ["npm", "start"]