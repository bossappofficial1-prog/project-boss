# --- Multi-stage build for smaller production image ---

# Stage 1: Build and compile
FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Copy only necessary files from the builder stage
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

# --- PERUBAHAN UTAMA DI SINI ---
# Instal dependensi OpenSSL yang dibutuhkan oleh Prisma Engine di Alpine
# RUN apk add --no-cache openssl1.1-compat libstdc++
# Jika openssl1.1-compat tidak ditemukan atau tidak berfungsi, coba:
RUN apk add --no-cache openssl libstdc++

# Pastikan Prisma CLI terinstal sebagai dependency production
RUN npm install prisma --omit=dev --no-fund --no-audit --ignore-scripts


EXPOSE 4444
CMD ["npm", "start"]