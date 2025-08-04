# Implementasi Checkout dengan Midtrans Integration

## Overview

Fitur checkout telah diimplementasikan dengan integrasi Midtrans popup payment untuk memproses pembayaran online. Customer dapat memilih outlet, menambahkan produk ke cart, lalu melakukan checkout dengan berbagai metode pembayaran yang disediakan Midtrans.

## Fitur yang Diimplementasikan

### 1. Halaman Checkout (`/outlets/[id]/checkout`)

- **Form customer**: Input nama dan nomor WhatsApp
- **Ringkasan pesanan**: Menampilkan item yang dipilih, quantity, dan harga
- **Perhitungan biaya**: Platform fee (3%) dan payment fee (1%)
- **Integrasi Midtrans Snap**: Popup payment gateway

### 2. Halaman Payment Status (`/outlets/[id]/payment`)

- **Success state**: Pembayaran berhasil
- **Pending state**: Pembayaran tertunda dengan opsi cek status
- **Failed state**: Pembayaran gagal dengan opsi retry
- **Customer support**: Link ke WhatsApp dan email

### 3. Cart Store Update

- Support untuk multiple items dengan quantity
- Validasi outlet yang berbeda
- Persistent storage menggunakan Pinia

## API Integration

### Request Format (POST /orders)

```json
{
  "guestCustomer": {
    "name": "Pito",
    "phone": "+6283180541892"
  },
  "outletId": "KOPIJ",
  "items": [
    {
      "productId": "c3d78131-6159-48bd-a891-10ebf5029798",
      "quantity": 2
    }
  ],
  "paymentMethod": "online"
}
```

### Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "orderId": "ORD-KOPIKJ-CT-250727-UTJ5TF",
    "totalAmount": 30000,
    "midtransTransactionToken": "0c91079b-dd33-45dd-8422-ee073352855b",
    "midtransRedirectUrl": "https://app.sandbox.midtrans.com/snap/v4/redirection/0c91079b-dd33-45dd-8422-ee073352855b"
  },
  "timestamp": "2025-07-27T03:00:50.608Z",
  "path": "/api/v1/orders"
}
```

## Midtrans Integration

### Setup

1. **Environment Variable**: Set `NUXT_PUBLIC_MIDTRANS_CLIENT_KEY` di `.env`
2. **Script Loading**: Midtrans Snap script dimuat di `nuxt.config.ts`
3. **Plugin**: `plugins/midtrans.client.ts` untuk inisialisasi global

### Payment Flow

1. Customer mengisi form checkout
2. Submit order ke backend API
3. Receive Midtrans transaction token
4. Open Midtrans Snap popup
5. Handle payment callbacks:
   - **onSuccess**: Redirect ke payment success page
   - **onPending**: Redirect ke payment pending page
   - **onError**: Show error message
   - **onClose**: Show cancellation message

### Payment Callbacks

```typescript
window.snap.pay(midtransTransactionToken, {
  onSuccess: (result) => {
    // Redirect to success page
    router.push(
      `/outlets/${outletId}/payment?order_id=${orderId}&status=success&total_amount=${totalAmount}`
    );
  },
  onPending: (result) => {
    // Redirect to pending page
    router.push(
      `/outlets/${outletId}/payment?order_id=${orderId}&status=pending&total_amount=${totalAmount}`
    );
  },
  onError: (result) => {
    // Show error and redirect
    router.push(
      `/outlets/${outletId}/payment?order_id=${orderId}&status=failed&total_amount=${totalAmount}`
    );
  },
  onClose: () => {
    // User closed popup
    toast.add({ title: "Pembayaran Dibatalkan" });
  },
});
```

## File Structure

```
pages/
  outlets/
    [id]/
      checkout.vue    # Halaman checkout dengan form customer dan ringkasan order
      payment.vue     # Halaman status pembayaran (success/pending/failed)
      index.vue       # Halaman outlet dengan daftar produk

plugins/
  midtrans.client.ts  # Plugin untuk inisialisasi Midtrans

stores/
  cart.ts            # Store untuk mengelola cart items

composables/
  useApi.ts          # Composable untuk API calls
  useToast.ts        # Composable untuk toast notifications
```

## Configuration

### Environment Variables (.env)

```bash
# API Backend
NUXT_PUBLIC_API_BASE_URL=http://localhost:6789/api/v1
NUXT_PUBLIC_BASE_URL=http://localhost:3000

# Midtrans Payment Gateway
NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-your-sandbox-key

# App Config
NUXT_PUBLIC_APP_NAME=BOSS
NUXT_PUBLIC_APP_VERSION=1.0.0
```

### Nuxt Config (nuxt.config.ts)

```typescript
app: {
  head: {
    script: [
      {
        src: "https://app.sandbox.midtrans.com/snap/snap.js",
        "data-client-key": process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY,
        defer: true,
      },
    ];
  }
}
```

## Testing

1. **Development**: Gunakan Midtrans Sandbox environment
2. **Test Cards**: Gunakan test card numbers dari Midtrans documentation
3. **Production**: Ganti client key ke production dan update script URL

## User Experience Flow

1. **Home Page**: Customer memilih outlet
2. **Outlet Page**: Customer browse produk dan add to cart
3. **Checkout Page**: Customer input data dan review order
4. **Payment Popup**: Midtrans Snap popup untuk payment
5. **Payment Status**: Redirect ke halaman status berdasarkan hasil payment
6. **Completion**: Customer dapat kembali ke outlet atau home

## Error Handling

- **Network errors**: Display user-friendly error messages
- **Validation errors**: Highlight required fields
- **Payment errors**: Provide retry options
- **Timeout**: Automatic status checking untuk pending payments

## Security Considerations

- **Client Key**: Hanya client key yang exposed di frontend
- **Server Key**: Disimpan di backend untuk verification
- **HTTPS**: Required untuk production Midtrans integration
- **Input Validation**: Sanitize semua user input

## Future Enhancements

1. **Order History**: Tracking order status untuk customers
2. **Multiple Payment Methods**: Support untuk berbagai payment gateway
3. **Discount Codes**: System voucher dan promo codes
4. **Notification**: Push notifications untuk status updates
5. **Analytics**: Payment conversion tracking
