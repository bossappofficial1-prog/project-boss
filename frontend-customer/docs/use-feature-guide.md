# Dokumentasi `useFeatureGuide`

Dokumentasi ini menjelaskan cara memakai sistem product tour/feature guide di frontend-customer.

## Ringkasan Arsitektur

Implementasi guide terdiri dari 3 bagian:

1. `FeatureGuideProvider` → menyimpan state guide aktif dan aksi (`start`, `next`, `prev`, `skip`, `stop`).
2. `FeatureGuideOverlay` → menampilkan highlight target + tooltip step.
3. `useFeatureGuide` → hook untuk mendaftarkan step per fitur dan mengontrol kapan guide dijalankan.

File utama:

- `src/providers/FeatureGuideProvider.tsx`
- `src/components/guides/FeatureGuideOverlay.tsx`
- `src/hooks/useFeatureGuide.ts`

## Prasyarat (Sudah Terpasang Saat Ini)

Pastikan aplikasi dibungkus provider dan overlay dipasang sekali di root layout.

Contoh (saat ini sudah ada di `src/app/layout.tsx`):

```tsx
<FeatureGuideProvider>
  <RootLayout>{children}</RootLayout>
  <FeatureGuideOverlay />
</FeatureGuideProvider>
```

## API `useFeatureGuide`

```ts
useFeatureGuide({
  id: string,
  steps: GuideStep[],
  autoStart?: boolean,      // default false
  runOnceKey?: string,      // localStorage key agar cuma tampil sekali
  delay?: number,           // default 400ms
  enabled?: boolean,        // default true
  options?: {
    onStart?: () => void,
    onComplete?: () => void,
    onSkip?: () => void,
    // onceKey diisi otomatis dari runOnceKey
  }
})
```

Return value:

```ts
{
  isActive: boolean,
  state: FeatureGuideState,
  currentStep: GuideStep | null,
  start: () => void,
  next: () => void,
  prev: () => void,
  skip: () => void,
  stop: () => void,
  stepIndex: number,
  totalSteps: number
}
```

## Struktur `GuideStep`

```ts
type GuideStep = {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector target elemen
  placement?: "top" | "bottom" | "left" | "right";
  offset?: number;
  focusPadding?: number;
};
```

## Cara Pakai (Pola Umum)

### 1) Tandai elemen target

Berikan atribut selector yang stabil, contoh `data-guide-target`:

```tsx
<button data-guide-target="checkout-button">Checkout</button>
```

### 2) Definisikan langkah guide

```tsx
const steps: GuideStep[] = [
  {
    id: "cart-checkout",
    title: "Lanjut ke pembayaran",
    description: "Klik tombol ini untuk melanjutkan proses checkout.",
    target: '[data-guide-target="checkout-button"]',
    placement: "top",
    focusPadding: 20,
  },
];
```

### 3) Panggil hook di komponen fitur

```tsx
const { start, isActive } = useFeatureGuide({
  id: "cart-guide",
  steps,
  autoStart: true,
  runOnceKey: "guide:cart",
  delay: 600,
  enabled: true,
  options: {
    onComplete: () => console.log("Cart guide selesai"),
  },
});
```

- `autoStart: true` → guide jalan otomatis.
- `runOnceKey` → guide hanya tampil sekali per browser/device.
- `start()` tetap bisa dipanggil manual (mis. dari tombol “Lihat tutorial”).

## Contoh Nyata di Proyek

Implementasi contoh ada di:

- `src/components/layouts/BottomNav.tsx`
- `src/components/shared/NavItem.tsx`

Pola yang dipakai:

- setiap item nav punya `data-guide-target`
- step dibangun dari konfigurasi menu
- guide hanya aktif untuk route tertentu (`enabled: isMainRoute`)
- auto start sekali pakai (`runOnceKey: "guide:bottom-nav"`)

## Kontrol Manual

Selain auto start, Anda bisa kontrol guide lewat return hook:

- `start()` → mulai guide
- `next()` / `prev()` → pindah step
- `skip()` → lewati guide (juga menyimpan `runOnceKey`)
- `stop()` → tutup guide tanpa status skip/complete

## Reset Status "Sudah Pernah Lihat"

Untuk menampilkan ulang guide yang memakai `runOnceKey`, gunakan helper:

```ts
import { resetGuideSeen } from "@/providers/FeatureGuideProvider";

resetGuideSeen("guide:bottom-nav");
```

Cocok dipakai untuk:

- menu debug internal
- tombol “Lihat tutorial lagi”
- kebutuhan QA/UAT

## Best Practice

1. Gunakan selector target yang stabil (`data-guide-target`), hindari selector rapuh.
2. Pastikan elemen target benar-benar muncul saat guide start.
3. Untuk komponen yang render async, gunakan `delay` lebih panjang.
4. Jangan jalankan banyak guide bersamaan; beri `enabled` sesuai konteks route/fitur.
5. Simpan durasi dan jumlah step tetap ringkas agar UX cepat.

## Troubleshooting

### Guide tidak muncul

- Pastikan komponen ada di dalam `FeatureGuideProvider`.
- Pastikan `FeatureGuideOverlay` terpasang di root layout.
- Cek `enabled` bernilai `true`.
- Cek selector `target` valid dan elemennya ada di DOM.
- Cek `runOnceKey` mungkin sudah tersimpan di localStorage.

### Guide muncul tapi highlight meleset

- Gunakan target pada elemen yang ukuran/posisinya stabil.
- Atur `focusPadding` dan `placement` per step.
- Jika ada animasi/layout shift, tambah `delay`.

### Guide terasa mengganggu performa saat pindah halaman

- Aktifkan guide hanya di route yang diperlukan (`enabled`).
- Hindari step terlalu banyak dalam satu guide.
- Gunakan `runOnceKey` agar tidak auto-start berulang.

## Checklist Implementasi Fitur Baru

- [ ] Tambahkan `data-guide-target` pada elemen target.
- [ ] Buat `GuideStep[]` dengan id unik.
- [ ] Pasang `useFeatureGuide` di komponen fitur.
- [ ] Tentukan `enabled`, `delay`, dan `runOnceKey`.
- [ ] Uji di mobile + desktop (penempatan tooltip berbeda).
- [ ] Uji reset dengan `resetGuideSeen()`.
