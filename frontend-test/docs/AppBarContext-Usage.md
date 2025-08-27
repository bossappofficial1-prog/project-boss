# AppBar Context Usage Guide

## Overview

AppBarContext adalah context yang digunakan untuk mengelola state AppBar secara global di aplikasi. Context ini memungkinkan komponen untuk mengkonfigurasi tampilan AppBar seperti title, tombol back, search, dan konten lainnya.

## Setup

AppBarProvider sudah dikonfigurasi di `src/app/(app)/layout.tsx` dan membalit semua komponen dalam aplikasi.

```tsx
<AppBarProvider>
  <GlobalAppBar />
  <main>{children}</main>
</AppBarProvider>
```

## Cara Penggunaan

### 1. Menggunakan useAppBarConfig Hook (Recommended)

Ini adalah cara yang paling mudah dan konsisten untuk mengkonfigurasi AppBar:

```tsx
import { useAppBarConfig } from "@/hooks/useAppBarConfig";

export default function MyPage() {
  // Konfigurasi AppBar secara otomatis
  useAppBarConfig({
    title: "Halaman Saya",
    showBackButton: true,
    showSearch: false,
    showMenu: false,
    variant: "default",
  });

  return <div>{/* konten halaman */}</div>;
}
```

### 2. Menggunakan useAppBar Hook Langsung

Jika Anda perlu kontrol lebih manual:

```tsx
import { useAppBar } from "@/context/AppBarContext";
import { useEffect } from "react";

export default function MyPage() {
  const { updateAppbar, resetAppBar } = useAppBar();

  useEffect(() => {
    updateAppbar({
      title: "Halaman Saya",
      showBackButton: true,
      showSearch: false,
    });

    // Cleanup jika perlu
    return () => {
      resetAppBar();
    };
  }, [updateAppbar]);

  return <div>{/* konten halaman */}</div>;
}
```

## Konfigurasi AppBar

### Properties Available

```typescript
interface AppBarState {
  title: string; // Judul halaman
  subtitle?: string; // Subjudul (opsional)
  showBackButton: boolean; // Tampilkan tombol back
  showSearch: boolean; // Tampilkan tombol search
  showMenu: boolean; // Tampilkan tombol menu
  variant: "default" | "primary" | "transparent" | "elevated"; // Variant styling
  rightContent?: React.ReactNode; // Konten kustom di sisi kanan
  loading?: boolean; // State loading
  centerTitle?: boolean; // Center align title
}
```

### Contoh Konfigurasi Umum

#### Halaman Home/Dashboard

```tsx
useAppBarConfig({
  title: "Boss App",
  showBackButton: false,
  showSearch: true,
  rightContent: (
    <Button variant="ghost" size="icon">
      <Bell className="h-5 w-5" />
    </Button>
  ),
});
```

#### Halaman Detail/Form

```tsx
useAppBarConfig({
  title: "Detail Produk",
  showBackButton: true,
  showSearch: false,
  showMenu: false,
});
```

#### Halaman dengan Loading State

```tsx
useAppBarConfig({
  title: "Memuat...",
  showBackButton: true,
  loading: true,
});
```

## Auto-Reset Behavior

AppBar secara otomatis akan reset ke state default ketika navigasi ke halaman lain. Ini dilakukan melalui `usePathname()` di AppBarProvider.

## Best Practices

1. **Gunakan useAppBarConfig** untuk konfigurasi sederhana
2. **Konfigurasi di level page**, bukan di komponen child
3. **Konsisten dengan naming**: gunakan judul yang clear dan user-friendly
4. **Sesuaikan showBackButton**: false untuk halaman utama, true untuk halaman detail
5. **Gunakan rightContent** untuk aksi-aksi penting seperti notifikasi atau menu

## Common Patterns

### Halaman Utama (Main Tabs)

```tsx
useAppBarConfig({
  title: "Home",
  showBackButton: false,
  showSearch: true,
});
```

### Halaman Detail

```tsx
useAppBarConfig({
  title: "Detail Outlet",
  showBackButton: true,
  showSearch: false,
});
```

### Halaman Form

```tsx
useAppBarConfig({
  title: "Edit Profil",
  showBackButton: true,
  showSearch: false,
  rightContent: (
    <Button variant="ghost" size="sm">
      Simpan
    </Button>
  ),
});
```

## Troubleshooting

### Error: "useAppBar must be used within AppBarProvider"

Pastikan komponen Anda berada di dalam AppBarProvider. Cek di `src/app/(app)/layout.tsx`.

### AppBar tidak terupdate

Pastikan Anda menggunakan hooks di dalam komponen yang di-render, bukan di luar React lifecycle.

### State tidak reset ketika pindah halaman

Pastikan AppBarProvider dibungkus dengan benar dan usePathname berfungsi dengan baik.
