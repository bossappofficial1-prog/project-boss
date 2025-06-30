#!/bin/bash

# Skrip ini akan dieksekusi di VPS untuk menjalankan proses deployment.

# Dapatkan path absolut dari skrip ini sendiri.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
DEPLOY_PATH="${SCRIPT_DIR}" # Sekarang DEPLOY_PATH adalah direktori tempat skrip ini berada.

echo "=== Memulai Proses Deployment ==="
echo "Lokasi Deployment: ${DEPLOY_PATH}"

# Pindah ke direktori deployment
cd "$DEPLOY_PATH" || { echo "ERROR: Gagal berpindah ke direktori $DEPLOY_PATH"; exit 1; }

# Muat variabel lingkungan dari .env.deploy dan pastikan mereka diekspor.
# 'set -a' akan membuat semua variabel yang dimuat setelahnya diekspor secara otomatis.
set -a
if [ -f ".env.deploy" ]; then
  source ./.env.deploy
  echo "File .env.deploy berhasil dimuat."
else
  echo "PERINGATAN: File .env.deploy tidak ditemukan. Pastikan variabel lingkungan diatur di tempat lain."
fi
set +a

# --- Login Docker Hub ---
echo "Login ke Docker Hub..."
# Simpan password ke file sementara yang aman
printf "%s" "${DOCKER_PASSWORD}" > docker_password_file.txt
chmod 600 docker_password_file.txt # Hanya pemilik yang bisa membaca/menulis

# Login menggunakan file sebagai stdin
cat docker_password_file.txt | docker login --username ${DOCKER_USERNAME} --password-stdin

# Hapus file password sementara untuk keamanan
rm docker_password_file.txt

if [ $? -ne 0 ]; then
    echo "ERROR: Login Docker gagal. Membatalkan deployment."
    exit 1
fi

# --- Tarik Image Docker Terbaru ---
echo "Menarik image Docker terbaru..."
# Gunakan nama file .yml di sini, sesuai dengan yang Anda salin
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull backend frontend

# --- Jalankan Migrasi Prisma ---
echo "Menjalankan migrasi Prisma..."
# Pastikan DB_DATABASE, DB_USER, DB_PASSWORD sudah tersedia dari .env.deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# --- Mulai/Perbarui Layanan Docker Compose ---
echo "Memulai layanan Docker Compose..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# --- Bersihkan Image Docker Lama---
echo "Membersihkan image Docker lama..."
docker image prune -f

echo "=== Deployment Selesai ==="