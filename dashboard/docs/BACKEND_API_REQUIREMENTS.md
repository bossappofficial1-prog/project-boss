# Backend API Requirements untuk Dashboard Transaction Management

Dokumentasi ini menjelaskan struktur API yang diharapkan oleh dashboard untuk fitur transaction management.

## 📋 API Endpoints

### 1. Get All Transactions (List with Pagination)

**Endpoint:**
```
GET /transactions
```

**Query Parameters:**
```typescript
{
  page?: number;      // Default: 1
  limit?: number;     // Default: 10
  status?: string;    // Optional: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  startDate?: string; // Optional: ISO date string
  endDate?: string;   // Optional: ISO date string
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": "uuid-string",
      "orderId": "uuid-string",
      "amount": 50000,
      "status": "PENDING",
      "paymentMethod": "QRIS",
      "createdAt": "2025-10-12T10:30:00.000Z",
      "updatedAt": "2025-10-12T10:30:00.000Z",
      "order": {
        // Optional: order details
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "timestamp": "2025-10-12T10:30:00.000Z",
  "path": "/api/v1/transactions"
}
```

---

### 2. Get Transaction by ID

**Endpoint:**
```
GET /transactions/:id
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Transaction retrieved successfully",
  "data": {
    "id": "uuid-string",
    "orderId": "uuid-string",
    "amount": 50000,
    "status": "PENDING",
    "paymentMethod": "QRIS",
    "createdAt": "2025-10-12T10:30:00.000Z",
    "updatedAt": "2025-10-12T10:30:00.000Z",
    "order": {
      "id": "uuid-string",
      "userId": "uuid-string",
      "items": [...],
      // ... other order details
    }
  },
  "timestamp": "2025-10-12T10:30:00.000Z",
  "path": "/api/v1/transactions/uuid-string"
}
```

---

### 3. Approve Payment

**Endpoint:**
```
PATCH /transactions/:id/approve
```

**Request Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pembayaran berhasil disetujui",
  "data": {
    "id": "uuid-string",
    "orderId": "uuid-string",
    "amount": 50000,
    "status": "SUCCESS",
    "paymentMethod": "QRIS",
    "createdAt": "2025-10-12T10:30:00.000Z",
    "updatedAt": "2025-10-12T10:35:00.000Z"
  },
  "timestamp": "2025-10-12T10:35:00.000Z",
  "path": "/api/v1/transactions/uuid-string/approve"
}
```

**Validation:**
- User harus memiliki role `OWNER` atau `ADMIN`
- Transaction status harus `PENDING`
- Response error jika validasi gagal:
```json
{
  "success": false,
  "message": "Unauthorized: Hanya OWNER/ADMIN yang dapat menyetujui pembayaran",
  "timestamp": "2025-10-12T10:35:00.000Z",
  "path": "/api/v1/transactions/uuid-string/approve"
}
```

---

### 4. Reject Payment

**Endpoint:**
```
PATCH /transactions/:id/reject
```

**Request Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Bukti pembayaran tidak jelas" // Optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pembayaran berhasil ditolak",
  "data": {
    "id": "uuid-string",
    "orderId": "uuid-string",
    "amount": 50000,
    "status": "FAILED",
    "paymentMethod": "QRIS",
    "createdAt": "2025-10-12T10:30:00.000Z",
    "updatedAt": "2025-10-12T10:35:00.000Z"
  },
  "timestamp": "2025-10-12T10:35:00.000Z",
  "path": "/api/v1/transactions/uuid-string/reject"
}
```

**Validation:**
- User harus memiliki role `OWNER` atau `ADMIN`
- Transaction status harus `PENDING`

---

### 5. Update Transaction Status

**Endpoint:**
```
PATCH /transactions/:id/status
```

**Request Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "CANCELLED" // 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Status transaksi berhasil diperbarui",
  "data": {
    "id": "uuid-string",
    "orderId": "uuid-string",
    "amount": 50000,
    "status": "CANCELLED",
    "paymentMethod": "QRIS",
    "createdAt": "2025-10-12T10:30:00.000Z",
    "updatedAt": "2025-10-12T10:35:00.000Z"
  },
  "timestamp": "2025-10-12T10:35:00.000Z",
  "path": "/api/v1/transactions/uuid-string/status"
}
```

---

## 🔐 Authentication & Authorization

### Authentication
Semua endpoint memerlukan JWT token yang valid. Token dikirim via:
- **Cookie** (httpOnly) - Recommended
- **Header** `Authorization: Bearer <token>`

### Authorization Rules

| Role | Get List | Get Detail | Approve | Reject | Update Status |
|------|----------|------------|---------|--------|---------------|
| OWNER | ✅ All | ✅ All | ✅ | ✅ | ✅ |
| ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ |
| USER | ✅ Own only | ✅ Own only | ❌ | ❌ | ❌ |

---

## 🌐 CORS Configuration

Backend harus mengizinkan origin dari dashboard:

```javascript
const allowedOrigins = process.env.CLIENT_URL?.split(',') || [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
}));
```

**Environment Variable:**
```
CLIENT_URL=http://localhost:3000,http://localhost:3010
```

---

## ❌ Error Response Format

Semua error harus mengikuti format standar:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (optional)",
  "timestamp": "2025-10-12T10:35:00.000Z",
  "path": "/api/v1/transactions/uuid-string/approve"
}
```

### Common Error Codes

| Status Code | Scenario |
|-------------|----------|
| 400 | Bad Request (invalid status, etc) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (transaction tidak ada) |
| 500 | Internal Server Error |

---

## ✅ Validation Rules

### Approve Payment
- ✅ Transaction status harus `PENDING`
- ✅ User role harus `OWNER` atau `ADMIN`
- ✅ Transaction ID harus valid UUID
- ✅ Atomic update (prevent race condition)

### Reject Payment
- ✅ Transaction status harus `PENDING`
- ✅ User role harus `OWNER` atau `ADMIN`
- ✅ Transaction ID harus valid UUID
- ✅ Reason adalah optional string
- ✅ Atomic update (prevent race condition)

### Update Status
- ✅ Status harus salah satu dari: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`
- ✅ User role harus `OWNER` atau `ADMIN`
- ✅ Transaction ID harus valid UUID

---

## 📝 Testing Checklist untuk Backend

- [ ] GET /transactions mengembalikan pagination structure
- [ ] GET /transactions/:id mengembalikan single transaction
- [ ] PATCH /transactions/:id/approve berhasil dengan role OWNER/ADMIN
- [ ] PATCH /transactions/:id/approve gagal dengan role USER
- [ ] PATCH /transactions/:id/approve gagal jika status bukan PENDING
- [ ] PATCH /transactions/:id/reject berhasil dengan reason
- [ ] PATCH /transactions/:id/reject berhasil tanpa reason
- [ ] CORS mengizinkan origin dashboard
- [ ] Authentication token validation bekerja
- [ ] Error response format konsisten

---

**Last Updated**: 12 Oktober 2025  
**Version**: 1.0.0
