# 🚀 **BOSS BACKEND API DOCUMENTATION**

## 📋 **Overview**
BOSS (Business One Stop System) Backend API adalah REST API yang dibangun dengan **Express.js**, **TypeScript**, dan **Prisma ORM** untuk mengelola sistem manajemen bisnis UMKM.

**Base URL**: `http://localhost:1234/api/v1`  

---

## 🔐 **Authentication**

### **Headers Required**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Response Format**
Semua API menggunakan format response standar:
```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "timestamp": string,
  "path": string
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email tidak valid"
    }
  ],
  "timestamp": "2025-09-10T10:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

---

## 🔑 **Authentication Endpoints**

### **1. Register**
```http
POST /auth/register
```
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id": "user_id",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "081234567890",
    "role": "OWNER",
    "verified": false
  }
}
```

### **2. Login**
```http
POST /auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "user_id",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "OWNER"
    },
    "token": "jwt_token_here"
  }
}
```

### **3. Get Current User**
```http
GET /auth/me
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "OWNER"
    },
    "business": {
      "id": "business_id",
      "name": "My Business",
      "description": "Business description"
    },
    "outlets": [
      {
        "id": "outlet_id",
        "name": "Main Outlet",
        "address": "Outlet address"
      }
    ]
  }
}
```

### **4. Verify Email**
```http
POST /auth/verify
```
**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

### **5. Logout**
```http
POST /auth/logout
```
**Headers:** `Authorization: Bearer <token>`

---

## 🏢 **Business Management**

### **1. Get All Businesses (Public)**
```http
GET /business
```

### **2. Get Business by ID (Public)**
```http
GET /business/:id
```

### **3. Get My Business**
```http
GET /business/my/business
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

### **4. Create Business**
```http
POST /business
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "name": "My Business",
  "description": "Business description",
  "type": "RESTAURANT",
  "address": "Business address",
  "phone": "081234567890"
}
```

### **5. Update Business**
```http
PATCH /business/:id
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "name": "Updated Business Name",
  "description": "Updated description"
}
```

### **6. Update Bank Account**
```http
PUT /business/:id/bank-account
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "bankName": "BCA",
  "accountNumber": "1234567890",
  "accountHolderName": "John Doe"
}
```

---

## 🏪 **Outlet Management**

### **1. Get All Outlets (Public)**
```http
GET /outlets
```

### **2. Get Featured Outlets (Public)**
```http
GET /outlets/featured
```

### **3. Find Nearby Outlets (Public)**
```http
GET /outlets/nearby?lat=-6.2088&lng=106.8456&radius=5
```

### **4. Get Outlet by ID (Public)**
```http
GET /outlets/:id
```

### **5. Get Outlets by Business ID (Public)**
```http
GET /outlets/business/:businessId?take=10&limit=10&search=outlet+name
```

### **6. Create Outlet**
```http
POST /outlets
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "name": "Main Outlet",
  "address": "Jl. Sudirman No. 1",
  "phone": "081234567890",
  "businessId": "business_id",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

### **7. Update Outlet**
```http
PATCH /outlets/:id
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "name": "Updated Outlet Name",
  "address": "Updated address",
  "phone": "081234567890"
}
```

### **8. Update Outlet Location**
```http
PATCH /outlets/:outletId/location
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

### **9. Delete Outlet**
```http
DELETE /outlets/:id
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

---

## 📦 **Product Management**

### **1. Search Products by Name (Public)**
```http
GET /products/search?q=product+name
```

### **2. Get Product by ID (Public)**
```http
GET /products/:id
```

### **3. Get Products by Outlet ID (Public)**
```http
GET /products/outlet/:outletId
```

### **4. Get Product Booking Slots (Public)**
```http
GET /products/:productId/booking-slots
```

### **5. Get Product Import Template**
```http
GET /products/template/import
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Response:** Excel file download

### **6. Create Product**
```http
POST /products
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 15000,
  "type": "GOODS",
  "category": "FOOD",
  "outletId": "outlet_id",
  "stock": 100,
  "imageUrl": "https://example.com/image.jpg"
}
```

### **7. Bulk Create Products**
```http
POST /products/bulk
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Content-Type:** `multipart/form-data`
**Body:** Excel file upload

### **8. Update Product**
```http
PATCH /products/:id
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "name": "Updated Product Name",
  "price": 20000,
  "stock": 150
}
```

### **9. Delete Product**
```http
DELETE /products/:id
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

---

## 🛒 **Order Management**

### **1. Create Order (Public/Guest)**
```http
POST /orders
```
**Body:**
```json
{
  "outletId": "outlet_id",
  "customerName": "Customer Name",
  "customerPhone": "081234567890",
  "customerEmail": "customer@example.com",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "notes": "Extra spicy"
    }
  ],
  "paymentMethod": "CASH",
  "tableNumber": "A1"
}
```

### **2. Get Order by Customer Phone**
```http
GET /orders/details/:phone
```

### **3. Get Order by ID**
```http
GET /orders/:id
```

### **4. Update Order Status**
```http
PATCH /orders/:id/status
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "status": "CONFIRMED"
}
```
**Status Options:** `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`

### **5. Complete Order**
```http
POST /orders/:id/complete
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

### **6. Refund Order**
```http
POST /orders/:id/refund
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "reason": "Customer request",
  "amount": 15000
}
```

### **7. Get Order Receipt**
```http
GET /orders/:id/receipt
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

### **8. List Goods Orders by Outlet**
```http
GET /orders/:outletId/goods?status=PENDING&limit=10
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

### **9. List Service Queue by Outlet**
```http
GET /orders/:outletId/queue
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

### **10. Create Payment**
```http
POST /orders/create-payment
```
**Body:**
```json
{
  "orderId": "order_id",
  "amount": 15000,
  "paymentMethod": "MIDTRANS"
}
```

---

## 📅 **Booking Management**

### **1. Get Booking Slots by Outlet**
```http
GET /products/:productId/booking-slots
```

### **2. Create Booking** *(Coming from booking routes)*
```http
POST /bookings
```
**Body:**
```json
{
  "productId": "product_id",
  "slotId": "slot_id",
  "customerName": "Customer Name",
  "customerPhone": "081234567890",
  "customerEmail": "customer@example.com",
  "bookingDate": "2025-09-15",
  "notes": "Special requirements"
}
```

---

## 💰 **Expense Management**

### **1. Create Expense**
```http
POST /expenses
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "description": "Office supplies",
  "amount": 50000,
  "category": "OPERATIONAL",
  "outletId": "outlet_id",
  "date": "2025-09-10"
}
```

### **2. Get Expenses by Outlet**
```http
GET /expenses/outlet/:outletId?startDate=2025-09-01&endDate=2025-09-30
```
**Headers:** `Authorization: Bearer <token>`

### **3. Update Expense**
```http
PUT /expenses/:id
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "description": "Updated description",
  "amount": 75000,
  "category": "MARKETING"
}
```

### **4. Delete Expense**
```http
DELETE /expenses/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## 📊 **Reports & Analytics**

### **1. Get Daily Report**
```http
GET /reports/daily/:outletId?date=2025-09-10
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 500000,
    "totalOrders": 25,
    "totalExpenses": 100000,
    "profit": 400000,
    "topProducts": [
      {
        "productId": "product_id",
        "name": "Product Name",
        "quantity": 10,
        "revenue": 150000
      }
    ]
  }
}
```

### **2. Get Business Dashboard**
```http
GET /dashboard/business/:businessId
```
**Headers:** `Authorization: Bearer <token>`

### **3. Get Outlet Dashboard**
```http
GET /dashboard/outlet/:outletId
```
**Headers:** `Authorization: Bearer <token>`

---

## 💸 **Withdrawal Management**

### **1. Get Withdrawal Calculation**
```http
GET /withdrawals/business/:businessId/calculation
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "availableAmount": 1000000,
    "pendingAmount": 200000,
    "totalRevenue": 1500000,
    "totalExpenses": 300000,
    "minWithdrawal": 50000
  }
}
```

### **2. Request Withdrawal**
```http
POST /withdrawals/business/:businessId/request
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "amount": 500000,
  "bankAccount": {
    "bankName": "BCA",
    "accountNumber": "1234567890",
    "accountHolderName": "John Doe"
  },
  "notes": "Monthly withdrawal"
}
```

### **3. Process Withdrawal (Admin Only)**
```http
PATCH /withdrawals/:id/process
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `ADMIN`
**Body:**
```json
{
  "status": "APPROVED",
  "adminNotes": "Approved by admin",
  "processedAt": "2025-09-10T10:00:00.000Z"
}
```

### **4. Get Withdrawal History**
```http
GET /withdrawals/business/:businessId/history?limit=10&offset=0
```
**Headers:** `Authorization: Bearer <token>`

---

## 📤 **File Upload**

### **1. Upload Single Image**
```http
POST /upload/image
```
**Content-Type:** `multipart/form-data`
**Body:** `image` file
**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://your-domain.com/uploads/image_filename.jpg",
    "filename": "image_filename.jpg",
    "size": 245760,
    "mimeType": "image/jpeg"
  }
}
```

### **2. Upload Multiple Images**
```http
POST /upload/images
```
**Content-Type:** `multipart/form-data`
**Body:** `images` files (max 5 files)

### **3. Upload Product Image**
```http
POST /upload/product/image
```
**Content-Type:** `multipart/form-data`
**Body:** `image` file

### **4. Upload User Avatar**
```http
POST /upload/user/avatar
```
**Content-Type:** `multipart/form-data`
**Body:** `avatar` file

### **5. Delete Image by Filename**
```http
DELETE /upload/image/:filename
```

### **6. Delete Image by URL**
```http
DELETE /upload/image
```
**Body:**
```json
{
  "url": "https://your-domain.com/uploads/image_filename.jpg"
}
```

---

## 👥 **User Management**

### **1. Get User Profile**
```http
GET /users/profile
```
**Headers:** `Authorization: Bearer <token>`

### **2. Update User Profile**
```http
PATCH /users/profile
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "Updated Name",
  "phone": "081234567890",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

## 🏪 **Staff Management**

### **1. Get Staff by Outlet**
```http
GET /staff/outlet/:outletId
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`

### **2. Add Staff**
```http
POST /staff
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "userId": "user_id",
  "outletId": "outlet_id",
  "role": "STAFF",
  "permissions": ["MANAGE_ORDERS", "VIEW_REPORTS"]
}
```

---

## 🕒 **Operating Hours**

### **1. Get Operating Hours**
```http
GET /operating-hours/outlet/:outletId
```

### **2. Update Operating Hours**
```http
PUT /operating-hours/outlet/:outletId
```
**Headers:** `Authorization: Bearer <token>`
**Role:** `OWNER`
**Body:**
```json
{
  "monday": { "open": "08:00", "close": "22:00", "isOpen": true },
  "tuesday": { "open": "08:00", "close": "22:00", "isOpen": true },
  "wednesday": { "open": "08:00", "close": "22:00", "isOpen": true },
  "thursday": { "open": "08:00", "close": "22:00", "isOpen": true },
  "friday": { "open": "08:00", "close": "22:00", "isOpen": true },
  "saturday": { "open": "08:00", "close": "22:00", "isOpen": true },
  "sunday": { "open": "08:00", "close": "22:00", "isOpen": false }
}
```

---

## 📱 **Notifications**

### **1. Get Notifications**
```http
GET /notifications
```
**Headers:** `Authorization: Bearer <token>`

### **2. Mark Notification as Read**
```http
PATCH /notifications/:id/read
```
**Headers:** `Authorization: Bearer <token>`

---

## 🔍 **Search**

### **1. Global Search**
```http
GET /search?q=search+term&type=product&outletId=outlet_id
```

---

## 💳 **Payment Methods**

### **1. Get Available Payment Methods**
```http
GET /payment-methods
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "CASH",
      "name": "Cash",
      "type": "OFFLINE",
      "isActive": true
    },
    {
      "id": "MIDTRANS",
      "name": "Midtrans (Credit Card, E-wallet)",
      "type": "ONLINE",
      "isActive": true
    }
  ]
}
```

---

## 🔒 **Security & Rate Limiting**

### **Rate Limits**
- **Order Creation**: 10 orders per minute per IP
- **Order Management**: 100 requests per minute per user
- **Authentication**: 5 login attempts per minute per IP

### **Security Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

### **Error Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🧪 **Testing**

### **Postman Collection**
Import `BOSS-API-Postman-Collection-Fixed.json` untuk testing semua endpoints.

### **Environment Variables**
```json
{
  "baseUrl": "http://localhost:4444/api/v1",
  "token": "your_jwt_token_here"
}
```

---

## 📝 **Changelog**

### **Version 1.0.0** - September 10, 2025
- Initial API documentation
- All core endpoints documented
- Authentication & authorization implemented
- Rate limiting added
- File upload support
- Comprehensive error handling

---

## 🔧 **Development Setup**

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/boss_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Midtrans
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
MIDTRANS_IS_PRODUCTION=false

# Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (for verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### **Docker Setup**
```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

---

## 🤝 **Support**

For technical support or API questions:
- Email: support@boss-api.com
- Documentation: https://docs.boss-api.com
- Status Page: https://status.boss-api.com

---

**Last Updated**: September 10, 2025  
**API Version**: v1.0.0  
**Backend**: Express.js + TypeScript + Prisma  
**Database**: PostgreSQL
