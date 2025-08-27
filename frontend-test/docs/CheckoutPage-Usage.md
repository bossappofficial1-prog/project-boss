# Alur Cart ke Checkout - Project Boss

## 🛒 Alur Lengkap: Cart → Checkout → Payment

### 1. **Halaman Cart (`/cart`)**

Pengguna dapat mengelola item dalam keranjang:

- ✅ Lihat ringkasan pesanan per outlet
- ✅ Update quantity atau hapus item
- ✅ Jadwalkan layanan (jika diperlukan)
- ✅ Tombol "Lanjut ke Pembayaran" → redirect ke `/checkout`

**Trigger ke Checkout:**

```tsx
// Di OrderSummary component
const handleCheckout = () => {
  if (hasUnscheduledServices) return;

  // Prepare checkout data dari cart items
  const checkoutData = CheckoutService.prepareCheckoutData(items);

  // Save ke localStorage untuk checkout page
  CheckoutService.saveCheckoutDataToStorage(checkoutData);

  // Redirect ke checkout
  router.push("/checkout");
};
```

### 2. **Halaman Checkout (`/checkout`)**

Pengguna menyelesaikan proses pembayaran:

- ✅ Load data dari localStorage (fallback redirect ke cart jika kosong)
- ✅ Tampilkan ringkasan pesanan yang sudah dikalkulasi
- ✅ Pilih metode pembayaran
- ✅ Proses pembayaran dengan instruksi yang jelas

**Data Flow:**

```tsx
// Data structure yang dikirim dari cart
interface CheckoutData {
  outlets: OutletSummary[];
  grandTotal: number;
}

// Outlet summary per outlet
interface OutletSummary {
  outletName: string;
  subtotal: number; // Total harga items di outlet ini
  transactionFee: number; // 0 jika >= 100k, 2500 jika < 100k
}
```

### 3. **Proses Pembayaran**

Flow pembayaran dengan state management yang jelas:

**State 1: Pilih Metode Pembayaran**

- QRIS: DANA, OVO, GoPay
- Virtual Account: BCA, BNI, Mandiri
- Kartu Kredit: Visa, Mastercard (coming soon)

**State 2: QRIS Payment**

- QR Code placeholder
- Timer countdown 15 menit
- Instruksi step-by-step
- Back button untuk kembali ke daftar metode

**State 3: Virtual Account Payment**

- Logo bank dan nomor VA
- Copy button untuk nomor VA
- Timer countdown 15 menit
- Instruksi transfer step-by-step
- Back button untuk kembali ke daftar metode

---

## 🎨 UI/UX Design System

### **Mengikuti Theme Aplikasi:**

- ✅ **Colors**: Menggunakan CSS variables (`--primary`, `--muted`, dll)
- ✅ **Cards**: Konsisten dengan `Card`, `CardHeader`, `CardTitle`, `CardContent`
- ✅ **Typography**: Font sizes dan weights yang seragam
- ✅ **Spacing**: Padding/margin yang konsisten (`space-y-6`, `p-4`)
- ✅ **Interactive Elements**: Hover states dan transitions
- ✅ **Icons**: Lucide icons dengan ukuran konsisten

### **Mobile-First Responsive:**

- Layout mengikuti pattern aplikasi (`lg:max-w-2xl mx-auto`)
- Touch-friendly button sizes
- Proper spacing untuk mobile interaction

### **AppBar Integration:**

- Checkout page menggunakan `useAppBarConfig`
- Back button otomatis ke halaman sebelumnya
- Title dan navigation yang konsisten

---

## 📂 File Structure

```
src/
├── app/(app)/
│   ├── cart/page.tsx                 # Cart page dengan tombol checkout
│   └── checkout/page.tsx             # Checkout page wrapper
├── components/checkout/
│   └── CheckoutPage.tsx              # Main checkout component
├── services/
│   └── checkout.ts                   # Service untuk transform data
├── types/
│   └── checkout.ts                   # TypeScript definitions
└── docs/
    └── CheckoutPage-Usage.md         # Dokumentasi ini
```

---

## 🔄 Data Flow Detail

### **1. Transform Cart ke Checkout Data**

```tsx
// CheckoutService.prepareCheckoutData()
cartItems → {
  outlets: [
    {
      outletName: "Bella Beauty - Kemang",
      subtotal: 80000,      // Total semua items di outlet ini
      transactionFee: 2500  // Biaya < 100k
    },
    {
      outletName: "Toko Sport Jaya",
      subtotal: 250000,     // Total semua items di outlet ini
      transactionFee: 0     // Gratis >= 100k
    }
  ],
  grandTotal: 332500        // Sum of (subtotal + transactionFee)
}
```

### **2. LocalStorage Persistence**

```tsx
// Save saat checkout
CheckoutService.saveCheckoutDataToStorage(data);

// Load saat page refresh
const data = CheckoutService.getCheckoutDataFromStorage();

// Clear setelah payment success
CheckoutService.clearCheckoutDataFromStorage();
```

### **3. Error Handling**

- ✅ Redirect ke cart jika tidak ada data checkout
- ✅ Loading state saat fetch data
- ✅ Fallback jika localStorage error
- ✅ Validation untuk required fields

---

## 🚀 Usage Examples

### **Test Flow Lengkap:**

1. **Tambah items ke cart dari berbagai outlet**
2. **Di halaman cart, klik "Lanjut ke Pembayaran"**
3. **Di halaman checkout, pilih metode pembayaran**
4. **Ikuti instruksi pembayaran**
5. **Test back navigation**

### **Test Data:**

```tsx
// Sample cart items yang akan di-transform
const cartItems = [
  {
    id: "1",
    productId: "prod1",
    name: "Facial Treatment",
    price: 80000,
    quantity: 1,
    outletId: "outlet1",
    outletName: "Bella Beauty - Kemang",
  },
  {
    id: "2",
    productId: "prod2",
    name: "Jersey Football",
    price: 250000,
    quantity: 1,
    outletId: "outlet2",
    outletName: "Toko Sport Jaya",
  },
];

// Hasil transform:
// - Bella Beauty: subtotal 80000 + fee 2500 = 82500
// - Toko Sport: subtotal 250000 + fee 0 = 250000
// - Grand Total: 332500
```

---

## 🎯 Key Features

- ✅ **Seamless Navigation**: Cart → Checkout tanpa kehilangan data
- ✅ **Data Persistence**: LocalStorage untuk handle page refresh
- ✅ **Multi-outlet Support**: Rincian transparan per outlet
- ✅ **Fee Calculation**: Otomatis berdasarkan subtotal outlet
- ✅ **Payment Methods**: Berbagai opsi dengan UI yang berbeda
- ✅ **Responsive Design**: Works di mobile dan desktop
- ✅ **Error Handling**: Robust error states dan fallbacks
- ✅ **Type Safety**: Full TypeScript coverage

## 🔧 Integration Ready

Komponen ini siap untuk integrasi dengan:

- **Payment Gateway**: Midtrans, Xendit, dll
- **Order Management**: API untuk create order
- **Inventory System**: Stock checking
- **User Management**: Auth dan user preferences
- **Analytics**: Track conversion funnel
