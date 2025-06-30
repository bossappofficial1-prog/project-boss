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

# --- PERUBAHAN DI SINI UNTUK MEMASTIKAN PATH BENAR ---
# Salin semua hasil build Nuxt.js.
# Untuk Nuxt 3, output biasanya di .output/
COPY --from=builder /app/frontend/.output ./
# Pastikan node_modules juga disalin untuk runtime
COPY --from=builder /app/frontend/node_modules ./node_modules

# Expose the application port
EXPOSE 3000

# Command to run the Nuxt.js server
CMD ["node", "./server/index.mjs"]