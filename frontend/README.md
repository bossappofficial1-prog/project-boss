Mantap — clear sekali sekarang, Icikbos. Saya bikinkan langsung panduan teknis frontend-nya buat rekan developer lain, sesuai kondisi real yang kamu jelaskan.

---

## 📑 **Panduan Teknis Frontend Project BOSS (Nuxt 3 + Tailwind)**

### 📌 **1️⃣ Setup & Development**

* **Jalankan project di lokal**

  ```bash
  npm install
  npm run dev
  ```
* **Environment config** di `.env`
  Jalankan backend lokal
  ```
  NUXT_PUBLIC_API_BASE_URL=http://localhost:4444/api/v1
  ```
  Pakai Ngrok Pitok
  ```
  NUXT_PUBLIC_API_BASE_URL=https://cheaply-full-leech.ngrok-free.app/api/v1
  ```

---

### 📌 **2️⃣ Struktur & Konvensi Folder**

**Folder penting:**

* `/components/base` → reusable komponen dasar (Button, Card, Input, dsb)
* `/components/app` → komponen layout umum (Header, Sidebar, Footer)
* `/layouts`

  * `default.vue` → untuk halaman umum (navbar, content, footer)
  * `blank.vue` → tanpa apapun (misal login/register)
  * `umkm.vue` → untuk halaman dashboard UMKM (sidebar, content)

---

### 📌 **3️⃣ Styling**

* Gunakan **Tailwind CSS** full utility
* Warna custom:

  ```js
  colors: {
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      ...
      950: '#450a0a',
    },
  }
  ```

  (ada di `tailwind.config.js`)

---

### 📌 **4️⃣ API Request**

**Semua request API wajib lewat composables useApiFetch**

```ts
const { data: outletsRes, error, pending, execute } = await useApiFetch('/outlets', {
  query: {
    limit: 3
  }
  // tambahkan body jika ada disini
}, true) //true jika lazy loading, kosongkan jika tidak
```
* **Token otomatis ter-attach**
* **API base URL ambil dari runtime config**

---

### 📌 **5️⃣ Komponen**

* **Komponen reusable taruh di `/components/base`**

  * Contoh: `BaseButton.vue`, `BaseInput.vue`, `BasePagination.vue`
* **Komponen layout taruh di `/components/app`**

  * Contoh: `AppHeader.vue`, `AppSidebar.vue`, `AppFooter.vue`


---

### 📌 **6️⃣ Icon**

**Pakai Nuxt Icon dengan custom collection**
Icon terinstall: lucide

**Cara pakai di template:**

```vue
<Icon name="boss:nama-file-ikon" /> 
```
> tanpa perlu .svg

---

### 📌 **7️⃣ Pengembangan**

* Jalankan di **branch `frontend`**
* Commit message pakai format:

  ```
  feat: tambah komponen BasePagination
  fix: perbaiki API request booking
  style: minor update tailwind spacing
  ```
* Tidak perlu jalankan Docker saat development frontend
  **Cukup `npm run dev`**

---

### 📌 **8️⃣ Layout**

* **default.vue** → Navbar, content, footer
* **blank.vue** → halaman tanpa layout
* **umkm.vue** → Sidebar dashboard UMKM + content

Gunakan `definePageMeta` di tiap halaman:

```ts
definePageMeta({
  layout: 'umkm'
})
```

---

## 📌 **9️⃣ Catatan Lanjutan**

* **Integrasi Midtrans**: nanti dipegang oleh rekan terkait
* **Print struk dan WA Notif**: belum implement, butuh riset
* **Import data Excel**: juga butuh testing & standarisasi template dulu

---

Kalau kamu mau, ini bisa saya tuliskan sekalian ke file `README.md` frontend-mu, tinggal bilang saja 👌
