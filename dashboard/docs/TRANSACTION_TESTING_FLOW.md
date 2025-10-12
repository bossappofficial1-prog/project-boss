# 🧪 Alur Testing Transaction Management Dashboard

Dokumen ini menjelaskan **langkah-langkah testing lengkap** untuk fitur Transaction Management yang telah diimplementasikan di dashboard.

---

## 📋 Daftar Isi

1. [Pre-Testing Checklist](#pre-testing-checklist)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing Flow](#e2e-testing-flow)
6. [Manual Testing Scenarios](#manual-testing-scenarios)
7. [Error Handling Testing](#error-handling-testing)
8. [Performance Testing](#performance-testing)
9. [Security Testing](#security-testing)

---

## ✅ Pre-Testing Checklist

Sebelum memulai testing, pastikan hal-hal berikut sudah ready:

### Backend Requirements
- [ ] Backend server berjalan (http://localhost:1234)
- [ ] Database PostgreSQL terkoneksi
- [ ] Redis service aktif
- [ ] RabbitMQ service aktif
- [ ] CORS configuration sudah benar (`CLIENT_URL` includes dashboard URL)

### Frontend Requirements
- [ ] Dashboard running (http://localhost:3000 atau port lain)
- [ ] Environment variables sudah di-set (`.env.local`)
- [ ] Dependencies terinstall (`npm install`)
- [ ] No TypeScript errors (`npm run build` atau `tsc --noEmit`)

### Test Data Requirements
- [ ] Minimal 3 user dengan role berbeda (OWNER, ADMIN, USER)
- [ ] Minimal 10 transactions dengan status berbeda
- [ ] Minimal 3 transactions dengan status PENDING untuk testing approve/reject

### Files to Verify
- [ ] `lib/apis/transaction.ts` - API service layer
- [ ] `hooks/useTransactions.ts` - Factory hooks
- [ ] `lib/utils/authorization.ts` - Authorization utility
- [ ] `components/transactions/ApprovePaymentButton.tsx`
- [ ] `components/transactions/RejectPaymentButton.tsx`
- [ ] `components/transactions/example-list-page.tsx`
- [ ] `components/transactions/example-detail-page.tsx`

---

## 🔧 Testing Environment Setup

### 1. Setup Backend Testing Environment

```bash
cd backend

# Pastikan environment variables di .env.backend
DATABASE_URL=postgresql://user:password@localhost:5432/boss_db
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
CLIENT_URL=http://localhost:3000,http://localhost:3010
JWT_SECRET=your-secret-key

# Start backend
npm run dev
```

### 2. Setup Dashboard Testing Environment

```bash
cd dashboard

# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:1234/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Install dependencies
npm install

# Start dashboard
npm run dev
```

### 3. Create Test Users (Backend)

```bash
# Run di backend terminal atau Prisma Studio
npx prisma studio

# Atau buat via seed script
npm run db:seed
```

**Test Users yang Dibutuhkan:**
```javascript
// User 1 - OWNER
{
  email: "owner@boss.com",
  password: "password123",
  role: "OWNER",
  name: "Test Owner"
}

// User 2 - ADMIN
{
  email: "admin@boss.com",
  password: "password123",
  role: "ADMIN",
  name: "Test Admin"
}

// User 3 - USER
{
  email: "user@boss.com",
  password: "password123",
  role: "USER",
  name: "Test User"
}
```

### 4. Create Test Transactions

```sql
-- Jalankan di PostgreSQL atau Prisma Studio
-- Insert minimal 10 transactions dengan berbagai status
INSERT INTO transactions (id, order_id, amount, status, payment_method, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'order-1', 50000, 'PENDING', 'QRIS', NOW(), NOW()),
  (gen_random_uuid(), 'order-2', 75000, 'PENDING', 'BANK_TRANSFER', NOW(), NOW()),
  (gen_random_uuid(), 'order-3', 100000, 'PENDING', 'E_WALLET', NOW(), NOW()),
  (gen_random_uuid(), 'order-4', 45000, 'SUCCESS', 'QRIS', NOW(), NOW()),
  (gen_random_uuid(), 'order-5', 60000, 'SUCCESS', 'BANK_TRANSFER', NOW(), NOW()),
  (gen_random_uuid(), 'order-6', 80000, 'FAILED', 'E_WALLET', NOW(), NOW()),
  (gen_random_uuid(), 'order-7', 90000, 'CANCELLED', 'QRIS', NOW(), NOW());
```

---

## 🧪 Unit Testing

### Test 1: Authorization Utility

**File**: `lib/utils/authorization.ts`

```typescript
// Test cases yang harus dicover
describe('Authorization Utility', () => {
  test('canApprovePayment returns true for OWNER', () => {
    const result = Authorization.canApprovePayment({ role: 'OWNER' });
    expect(result).toBe(true);
  });

  test('canApprovePayment returns true for ADMIN', () => {
    const result = Authorization.canApprovePayment({ role: 'ADMIN' });
    expect(result).toBe(true);
  });

  test('canApprovePayment returns false for USER', () => {
    const result = Authorization.canApprovePayment({ role: 'USER' });
    expect(result).toBe(false);
  });

  test('canRejectPayment works correctly', () => {
    expect(Authorization.canRejectPayment({ role: 'OWNER' })).toBe(true);
    expect(Authorization.canRejectPayment({ role: 'ADMIN' })).toBe(true);
    expect(Authorization.canRejectPayment({ role: 'USER' })).toBe(false);
  });

  test('isOwner returns correct value', () => {
    expect(Authorization.isOwner({ role: 'OWNER' })).toBe(true);
    expect(Authorization.isOwner({ role: 'ADMIN' })).toBe(false);
    expect(Authorization.isOwner({ role: 'USER' })).toBe(false);
  });

  test('isAdminOrOwner returns correct value', () => {
    expect(Authorization.isAdminOrOwner({ role: 'OWNER' })).toBe(true);
    expect(Authorization.isAdminOrOwner({ role: 'ADMIN' })).toBe(true);
    expect(Authorization.isAdminOrOwner({ role: 'USER' })).toBe(false);
  });
});
```

**Cara Test Manual:**
1. Buka file `lib/utils/authorization.ts`
2. Buka browser console di dashboard
3. Test di console:
```javascript
// Copy-paste kode authorization.ts
const Authorization = { ... };

// Test
console.log(Authorization.canApprovePayment({ role: 'OWNER' })); // true
console.log(Authorization.canApprovePayment({ role: 'USER' })); // false
```

---

### Test 2: Transaction API Service

**File**: `lib/apis/transaction.ts`

**Manual Testing via Browser DevTools:**

```javascript
// Test di browser console
const testApi = async () => {
  try {
    // Test 1: Get all transactions
    const listResponse = await fetch('http://localhost:1234/api/v1/transactions?page=1&limit=10', {
      credentials: 'include'
    });
    const listData = await listResponse.json();
    console.log('List Response:', listData);
    console.assert(listData.success === true, 'List should succeed');
    console.assert(listData.pagination !== undefined, 'Should have pagination');

    // Test 2: Get by ID
    const transactionId = listData.data[0].id;
    const detailResponse = await fetch(`http://localhost:1234/api/v1/transactions/${transactionId}`, {
      credentials: 'include'
    });
    const detailData = await detailResponse.json();
    console.log('Detail Response:', detailData);
    console.assert(detailData.data.id === transactionId, 'Should return correct transaction');

    console.log('✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

testApi();
```

---

### Test 3: React Query Hooks

**File**: `hooks/useTransactions.ts`

**Test dengan React DevTools:**

1. Install React Query DevTools di component:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

2. Buka dashboard, lihat React Query DevTools panel
3. Verify:
   - [ ] Query key `['transactions', params]` muncul
   - [ ] Query status: loading → success
   - [ ] Data structure sesuai dengan PaginatedResponse<Transaction>
   - [ ] Mutations (approve/reject) terdaftar

---

## 🔗 Integration Testing

### Scenario 1: Full Transaction List Flow

**Steps:**
1. Login sebagai OWNER
2. Navigate ke halaman transactions
3. Verify: List muncul dengan pagination
4. Change page → Verify data berubah
5. Change limit → Verify jumlah data berubah
6. Filter by status → Verify filter bekerja

**Expected Results:**
```
✅ List muncul dengan minimal 1 transaction
✅ Pagination controls visible
✅ Current page number correct
✅ Total pages calculated correctly
✅ Status filter mengubah query key
✅ React Query re-fetch saat params berubah
```

---

### Scenario 2: Approve Payment Integration

**Steps:**
1. Login sebagai OWNER atau ADMIN
2. Find transaction dengan status PENDING
3. Click "Approve Payment" button
4. Verify confirmation dialog muncul
5. Click "Ya, Setujui"
6. Wait for API call
7. Verify success toast
8. Verify transaction status berubah ke SUCCESS
9. Verify list auto-refresh

**Expected Results:**
```
✅ Button hanya muncul untuk PENDING transactions
✅ Confirmation dialog tampil
✅ Loading state saat mutation berjalan
✅ Success toast muncul
✅ Transaction status update ke SUCCESS
✅ React Query cache invalidated
✅ List auto-refresh tanpa reload page
```

**Test dengan Different Roles:**
- [ ] OWNER → Should see button
- [ ] ADMIN → Should see button
- [ ] USER → Button should NOT appear

---

### Scenario 3: Reject Payment Integration

**Steps:**
1. Login sebagai OWNER atau ADMIN
2. Find transaction dengan status PENDING
3. Click "Reject Payment" button
4. Verify dialog dengan textarea muncul
5. Type rejection reason: "Bukti pembayaran tidak jelas"
6. Click "Tolak Pembayaran"
7. Wait for API call
8. Verify success toast
9. Verify transaction status berubah ke FAILED
10. Verify list auto-refresh

**Expected Results:**
```
✅ Dialog with textarea muncul
✅ Reason field optional (can submit empty)
✅ Loading state during mutation
✅ Success toast appears
✅ Status update to FAILED
✅ List auto-refresh
```

---

## 🎯 E2E Testing Flow

### Full User Journey - OWNER Role

```
1. LOGIN
   ├─ Navigate to /auth/login
   ├─ Enter: owner@boss.com / password123
   ├─ Click "Masuk"
   └─ Verify redirect to dashboard

2. VIEW TRANSACTIONS
   ├─ Navigate to /admin/transactions (atau /owner/transactions)
   ├─ Verify list muncul
   ├─ Verify pagination visible
   └─ Verify dapat melihat semua transactions

3. FILTER PENDING
   ├─ Select filter: "PENDING"
   ├─ Click "Apply Filter"
   ├─ Verify hanya PENDING transactions muncul
   └─ Verify approve/reject buttons visible

4. APPROVE PAYMENT
   ├─ Click "Approve Payment" pada transaction pertama
   ├─ Verify confirmation dialog
   ├─ Click "Ya, Setujui"
   ├─ Wait for loading spinner
   ├─ Verify success toast: "Pembayaran berhasil disetujui"
   ├─ Verify status badge berubah ke "SUCCESS"
   └─ Verify approve button hilang dari transaction tersebut

5. REJECT PAYMENT
   ├─ Click "Reject Payment" pada transaction lain
   ├─ Verify dialog dengan textarea
   ├─ Type reason: "Bukti pembayaran tidak valid"
   ├─ Click "Tolak Pembayaran"
   ├─ Verify success toast: "Pembayaran berhasil ditolak"
   ├─ Verify status badge berubah ke "FAILED"
   └─ Verify reject button hilang

6. PAGINATION
   ├─ Click "Next Page"
   ├─ Verify page number berubah
   ├─ Verify URL parameter updated (?page=2)
   └─ Verify data berubah

7. VIEW DETAIL
   ├─ Click salah satu transaction
   ├─ Navigate to detail page
   ├─ Verify transaction details muncul
   ├─ Verify approve/reject buttons (jika PENDING)
   └─ Test approve/reject dari detail page

8. LOGOUT
   └─ Verify berhasil logout
```

---

### Full User Journey - ADMIN Role

**Hampir sama dengan OWNER, verify:**
- [ ] Dapat approve payment
- [ ] Dapat reject payment
- [ ] Dapat view all transactions
- [ ] Authorization checks pass

---

### Full User Journey - USER Role

```
1. LOGIN as USER
   └─ Login dengan user@boss.com

2. VIEW TRANSACTIONS
   ├─ Navigate to transactions page
   └─ Verify hanya melihat transactions milik sendiri

3. VERIFY NO APPROVE/REJECT
   ├─ Verify approve button TIDAK muncul
   ├─ Verify reject button TIDAK muncul
   └─ Verify hanya read-only access

4. ATTEMPT DIRECT API CALL (Security Test)
   ├─ Open browser console
   ├─ Try manual approve API call
   └─ Verify API returns 403 Forbidden
```

---

## 🐛 Error Handling Testing

### Test 1: Network Error

**Steps:**
1. Open DevTools → Network tab
2. Set "Offline" mode
3. Try approve payment
4. Verify error toast muncul
5. Verify button kembali ke state normal (not loading)

**Expected:**
```
✅ Error toast: "Gagal menyetujui pembayaran"
✅ Button tidak stuck di loading state
✅ User dapat retry
```

---

### Test 2: Invalid Transaction ID

**Steps:**
1. Manually call API dengan invalid UUID
2. Verify 404 error handling

```javascript
// Test di console
fetch('http://localhost:1234/api/v1/transactions/invalid-uuid/approve', {
  method: 'PATCH',
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

**Expected:**
```
✅ API returns 404
✅ Error message: "Transaction not found"
```

---

### Test 3: Already Processed Transaction

**Steps:**
1. Approve transaction dengan status SUCCESS
2. Verify error handling

**Expected:**
```
✅ API returns 400 Bad Request
✅ Error message: "Transaction already processed"
✅ Frontend shows error toast
```

---

### Test 4: Unauthorized Access

**Steps:**
1. Login as USER
2. Try to call approve API directly
3. Verify 403 Forbidden

**Expected:**
```
✅ API returns 403
✅ Frontend authorization prevents button from showing
```

---

## ⚡ Performance Testing

### Test 1: Large Dataset Pagination

**Setup:**
```sql
-- Insert 1000 transactions untuk test
DO $$
BEGIN
  FOR i IN 1..1000 LOOP
    INSERT INTO transactions (id, order_id, amount, status, payment_method, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'order-' || i,
      (RANDOM() * 100000)::int,
      (ARRAY['PENDING', 'SUCCESS', 'FAILED'])[FLOOR(RANDOM() * 3 + 1)],
      (ARRAY['QRIS', 'BANK_TRANSFER', 'E_WALLET'])[FLOOR(RANDOM() * 3 + 1)],
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW()
    );
  END LOOP;
END $$;
```

**Test:**
1. Load transaction list
2. Measure time to first render
3. Test pagination performance
4. Test filter performance

**Expected Performance:**
```
✅ First load < 1 second
✅ Pagination < 500ms
✅ Filter apply < 500ms
✅ No UI freeze during loading
✅ Smooth scrolling
```

---

### Test 2: React Query Caching

**Steps:**
1. Load transaction list (page 1)
2. Navigate to detail page
3. Go back to list
4. Verify data loads instantly dari cache

**Expected:**
```
✅ Instant load dari cache
✅ Background refetch (optional)
✅ No duplicate API calls
```

---

### Test 3: Concurrent Mutations

**Test:**
1. Open 2 browser tabs dengan same transaction
2. Approve di tab 1
3. Immediately approve di tab 2
4. Verify race condition handling

**Expected:**
```
✅ Only one succeeds
✅ Second gets error: "Already processed"
✅ Both tabs eventually show correct state
```

---

## 🔐 Security Testing

### Test 1: CSRF Protection

**Verify:**
- [ ] API menggunakan httpOnly cookies
- [ ] SameSite cookie attribute set
- [ ] CORS properly configured

---

### Test 2: XSS Prevention

**Test:**
```javascript
// Try XSS in rejection reason
const xssPayload = '<script>alert("XSS")</script>';

// Reject payment dengan XSS payload
// Verify output is escaped
```

**Expected:**
```
✅ Script tidak executed
✅ Text ditampilkan as plain text
✅ HTML entities escaped
```

---

### Test 3: SQL Injection (Backend)

**Test:**
```javascript
// Try SQL injection in transaction ID
const sqlPayload = "' OR '1'='1";

fetch(`http://localhost:1234/api/v1/transactions/${sqlPayload}`, {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

**Expected:**
```
✅ Query parameterized (Prisma handles this)
✅ Returns 400 or 404
✅ No database exposure
```

---

## 📊 Testing Checklist Summary

### Frontend Components
- [ ] ApprovePaymentButton renders correctly
- [ ] ApprovePaymentButton shows only for PENDING status
- [ ] ApprovePaymentButton hides for non-OWNER/ADMIN
- [ ] ApprovePaymentButton confirmation dialog works
- [ ] ApprovePaymentButton loading state works
- [ ] ApprovePaymentButton success callback fires
- [ ] RejectPaymentButton renders correctly
- [ ] RejectPaymentButton dialog with textarea works
- [ ] RejectPaymentButton can submit without reason
- [ ] RejectPaymentButton loading state works
- [ ] RejectPaymentButton success callback fires

### Hooks
- [ ] useTransactionList returns PaginatedResponse
- [ ] useTransactionList supports pagination params
- [ ] useTransactionList supports filter params
- [ ] useTransaction returns single transaction
- [ ] useApprovePayment mutation works
- [ ] useApprovePayment invalidates cache
- [ ] useRejectPayment mutation works
- [ ] useRejectPayment invalidates cache with reason

### API Integration
- [ ] GET /transactions works
- [ ] GET /transactions pagination works
- [ ] GET /transactions filter works
- [ ] GET /transactions/:id works
- [ ] PATCH /transactions/:id/approve works
- [ ] PATCH /transactions/:id/reject works
- [ ] PATCH /transactions/:id/reject with reason works

### Authorization
- [ ] OWNER can approve
- [ ] OWNER can reject
- [ ] ADMIN can approve
- [ ] ADMIN can reject
- [ ] USER cannot approve
- [ ] USER cannot reject
- [ ] API returns 403 for unauthorized

### Error Handling
- [ ] Network error shows toast
- [ ] Invalid ID shows error
- [ ] Already processed shows error
- [ ] Unauthorized shows error
- [ ] Validation errors show correctly

### Performance
- [ ] List loads < 1s
- [ ] Pagination < 500ms
- [ ] Cache works correctly
- [ ] No memory leaks
- [ ] No duplicate requests

### Security
- [ ] CSRF protection active
- [ ] XSS prevented
- [ ] SQL injection prevented
- [ ] Authorization enforced
- [ ] Sensitive data protected

---

## 🎬 Quick Test Script

Jalankan script ini untuk rapid testing:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Dashboard
cd dashboard
npm run dev

# Terminal 3: Test commands
# Login as OWNER
curl -X POST http://localhost:1234/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@boss.com","password":"password123"}' \
  -c cookies.txt

# Get transactions
curl http://localhost:1234/api/v1/transactions?page=1&limit=10 \
  -b cookies.txt

# Approve payment (replace ID)
curl -X PATCH http://localhost:1234/api/v1/transactions/{ID}/approve \
  -b cookies.txt

# Reject payment (replace ID)
curl -X PATCH http://localhost:1234/api/v1/transactions/{ID}/reject \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test rejection"}' \
  -b cookies.txt
```

---

## 📝 Bug Report Template

Jika menemukan bug, gunakan template ini:

```markdown
## Bug Report

**Judul**: [Deskripsi singkat bug]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:


**Actual Result**:


**Screenshots**:
[Attach if applicable]

**Environment**:
- Browser: 
- OS: 
- Dashboard version: 
- Backend version: 

**Console Errors**:
```
[Paste console errors]
```

**Network Tab**:
[Screenshot atau HAR file]
```

---

**Last Updated**: 12 Oktober 2025  
**Version**: 1.0.0  
**Tested By**: [Your Name]
