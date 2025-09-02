# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build # Ini akan menghasilkan .output/ atau .nuxt/

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/frontend

# Copy Nuxt.js build output
COPY --from=builder /app/frontend/.output ./
# Copy node_modules for runtime dependencies
COPY --from=builder /app/frontend/node_modules ./node_modules
# Copy package.json for any runtime scripts
COPY --from=builder /app/frontend/package.json ./

# Expose the application port
EXPOSE 3000

# Command to run the Nuxt.js server
# Command to run the Nuxt.js server
CMD ["node", ".output/server/index.mjs"]