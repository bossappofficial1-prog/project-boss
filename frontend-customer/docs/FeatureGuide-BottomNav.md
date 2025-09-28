# Panduan Guided Tour untuk Bottom Navigation

Panduan ini menjelaskan cara membangun pengalaman "tour" seperti contoh pada aplikasi mobile, tetapi diterapkan di web menggunakan komponen `BottomNav`. Implementasi ini menjaga kode tetap terstruktur, bebas duplikasi, dan mudah dirawat.

## Arsitektur

- **`FeatureGuideProvider`** (`src/providers/FeatureGuideProvider.tsx`)
  - Menyediakan konteks global untuk mengelola state tour.
  - Menyimpan langkah (steps), indeks aktif, serta meta informasi seperti `runOnceKey`.
- **`useFeatureGuide`** (`src/hooks/useFeatureGuide.ts`)
  - Hook untuk mendaftarkan dan men-trigger tour dari komponen.
  - Mendukung opsi `autoStart`, `runOnceKey`, dan callback lifecycle.
- **`FeatureGuideOverlay`** (`src/components/guides/FeatureGuideOverlay.tsx`)
  - Layer visual yang merender highlight, tooltip, dan kontrol seperti "Lewati" serta "Lanjut".
- **`NavItem`** (`src/components/shared/NavItem.tsx`)
  - Menyediakan atribut `data-guide-target` agar setiap item navigasi dapat di-highlight tanpa kode tambahan.

Semua bagian tersebut diregistrasi di `src/app/layout.tsx`, sehingga tour tersedia di seluruh aplikasi.

## Konfigurasi Langkah BottomNav

`src/components/layouts/BottomNav.tsx` mendefinisikan array `menus` yang memuat metadata navigasi sekaligus konten tour:

```tsx
const menus: Menu[] = [
  {
    id: "home",
    href: "/",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
    guide: {
      title: "Mulai dari beranda",
      description:
        "Temukan promosi terbaru dan rekomendasi layanan sejak awal.",
    },
  },
  {
    id: "nearby",
    href: "/nearby",
    label: "Nearby",
    icon: <MapPin className="w-5 h-5" />,
    guide: {
      title: "Cari layanan terdekat",
      description: "Jangkau outlet terdekat dengan sekali tap.",
    },
  },
  {
    id: "cart",
    href: "/cart",
    label: "Cart",
    icon: <ShoppingCart className="w-5 h-5" />,
    guide: {
      title: "Kelola pesanan sebelum checkout",
      description: "Semua produk yang kamu pilih akan muncul di sini...",
    },
  },
  // ...
];
```

Langkah tur dirakit sekali (`bottomNavGuideSteps`) dengan memanfaatkan data dari `menus`, sehingga tidak ada duplikasi label maupun deskripsi. Hook `useFeatureGuide` dipanggil dengan konfigurasi berikut:

```tsx
useFeatureGuide({
  id: "bottom-nav-guide",
  steps: bottomNavGuideSteps,
  autoStart: true,
  runOnceKey: "guide:bottom-nav",
  delay: 1200,
  enabled: mainRoutes.includes(pathname),
});
```

- `autoStart` memastikan tour muncul otomatis saat pengguna pertama kali melihat BottomNav.
- `runOnceKey` menyimpan status di `localStorage` agar tour tidak berulang.
- `enabled` membatasi tour hanya pada halaman yang relevan (`/`, `/cart`, `/nearby`, `/orders`, `/profile`).
- Overlay bertema card merah-putih dirender oleh `FeatureGuideOverlay`, mengikuti referensi mobile.
- Overlay otomatis menyesuaikan warna untuk mode terang maupun gelap sehingga tetap kontras.

## Best Practice yang Dipenuhi

1. **Tidak ada duplikasi konten** – label & deskripsi guide disimpan di array `menus` yang sama dengan konfigurasi navigasi.
2. **Modular & reusable** – provider, hook, dan overlay dapat digunakan kembali untuk area lain selain BottomNav.
3. **Performa terjaga** – overlay dimuat secara lazy (SSR aman) dan hanya aktif ketika guide sedang berjalan.
4. **Aksesibilitas** – overlay menggunakan `role="dialog"`, tombol keyboard-friendly, dan highlight tidak memblokir fokus.
5. **Persistensi yang ramah pengguna** – pengguna cukup melihat atau menutup tour sekali; status tersimpan di `localStorage`.

## Menambahkan Tour Baru

1. Tambahkan metadata `guide` pada elemen yang ingin dijelaskan (misalnya komponen kartu, tombol CTA, dsb.).
2. Buat array langkah baru (mirip `bottomNavGuideSteps`).
3. Panggil `useFeatureGuide` di komponen target dengan konfigurasi yang diperlukan.
4. Pastikan `FeatureGuideProvider` sudah membungkus UI (sudah dilakukan di `layout.tsx`).

Dengan pola ini, kita bisa membuat pengalaman onboarding yang konsisten dan mudah dikelola, tanpa mengorbankan kualitas kode.</content>
