# Testing Checkout Flow

## Prerequisites

1. Set up environment variables in `.env`:

```bash
NUXT_PUBLIC_API_BASE_URL=http://localhost:6789/api/v1
NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-your-sandbox-key
```

2. Ensure backend API is running on port 6789

## Test Flow

### 1. Add Items to Cart

1. Navigate to `/outlets/[outlet-id]`
2. Click "Add to Cart" on any product
3. Verify cart counter updates
4. Open cart sidebar by clicking cart button

### 2. Checkout Process

1. Click "Checkout" button in cart sidebar
2. Fill in customer information:
   - Name: "Test Customer"
   - Phone: "+62812345678"
3. Review order summary
4. Click "Bayar Sekarang"

### 3. Payment Flow

1. Midtrans popup should appear
2. Use test payment methods:
   - **Credit Card**: 4811 1111 1111 1114
   - **CVV**: 123
   - **Expiry**: 01/25
   - **OTP**: 112233

### 4. Payment Results

- **Success**: Redirected to `/outlets/[id]/payment?status=success`
- **Pending**: Redirected to `/outlets/[id]/payment?status=pending`
- **Failed**: Error message shown

## Test Data Structure

### Sample Product Data

```json
{
  "id": "prod-123",
  "name": "Kopi Espresso",
  "price": 15000,
  "outletId": "outlet-123",
  "image": "https://example.com/coffee.jpg"
}
```

### Sample Cart State

```json
{
  "items": [
    {
      "product": {
        "id": "prod-123",
        "name": "Kopi Espresso",
        "price": 15000,
        "outletId": "outlet-123"
      },
      "quantity": 2
    }
  ],
  "outletId": "outlet-123"
}
```

### Expected API Request

```json
{
  "guestCustomer": {
    "name": "Test Customer",
    "phone": "+62812345678"
  },
  "outletId": "outlet-123",
  "items": [
    {
      "productId": "prod-123",
      "quantity": 2
    }
  ],
  "paymentMethod": "online"
}
```

## Manual Testing Checklist

- [ ] Cart functionality (add, remove, update quantity)
- [ ] Cart persistence across page reloads
- [ ] Outlet validation (clear cart when switching outlets)
- [ ] Checkout form validation
- [ ] API request formatting
- [ ] Midtrans popup integration
- [ ] Payment success handling
- [ ] Payment pending handling
- [ ] Payment failure handling
- [ ] Payment cancellation handling
- [ ] Responsive design on mobile
- [ ] Dark mode compatibility

## Common Issues

### 1. Midtrans Script Not Loading

- Check NUXT_PUBLIC_MIDTRANS_CLIENT_KEY is set
- Verify script src in nuxt.config.ts
- Check browser console for errors

### 2. API Connection Issues

- Verify NUXT_PUBLIC_API_BASE_URL
- Check backend server is running
- Verify CORS settings

### 3. Cart Not Persisting

- Check localStorage in browser
- Verify pinia-plugin-persistedstate is installed
- Clear browser cache if needed

### 4. Payment Popup Not Appearing

- Check window.snap is available
- Verify Midtrans script is loaded
- Check console for JavaScript errors
