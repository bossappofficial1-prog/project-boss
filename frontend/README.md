# Business One Stop System (BOSS) - Frontend

## TODO
[] Halaman dasar

## Struktur Direktori
```
frontend/
├── app/
│   ├── assets/            # File statis
│   ├── components/        # Komponen modular
│   ├── lauouts/           # Templaye halaman aplikasi
│   ├── pages/             # Halaman aplikasi
│   ├── app.vue            # Komponen root aplikasi Nuxt
│   ├── app.config.ts
├── public/
├── server/
├── nuxt.config.ts         # Konfigurasi utama Nuxt.js
├── package.json
```

## Pengembangan
- Gunakan komponen Nuxt UI seperti `<UButton>`, `<UCard>`, atau `<UForm>` untuk membangun antarmuka.
- Kustomisasi gaya menggunakan kelas Tailwind CSS.
- Untuk integrasi pembayaran, gunakan SDK resmi (misalnya Midtrans) di sisi frontend.
