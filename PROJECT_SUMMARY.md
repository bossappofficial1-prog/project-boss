# 📊 **PROJECT SUMMARY - BOSS FRONTEND**

## 🎯 **Fitur-Fitur Utama**

### **1. 🔐 Authentication & User Management**
- **Login/Register** dengan JWT token
- **Profile Management** (edit nama, email, phone, avatar)
- **Role-based Access** (OWNER, ADMIN, USER)
- **Email Verification** status
- **Password Management**

### **2. 🏢 Business Management (UMKM)**
- **Business Profile Setup** (nama bisnis, deskripsi, bank info)
- **Business Dashboard** dengan statistik
- **Multi-outlet Support** 
- **Business Verification** status

### **3. 🏪 Outlet Management**
- **CRUD Outlets** (Create, Read, Update, Delete)
- **Outlet Selection** untuk operasional
- **Outlet Location** dengan maps
- **Outlet Status** (buka/tutup)

### **4. 📦 Product Management**
- **Product CRUD** (goods & services)
- **Product Categories**
- **Image Upload** untuk produk
- **Bulk Import** produk via Excel
- **Product Template** download
- **Stock Management**
- **Price Management**

### **5. 📅 Booking System**
- **Service Booking** untuk layanan
- **Time Slot Management**
- **Booking Calendar**
- **Booking Status** tracking

### **6. 🛒 E-commerce & Shopping**
- **Product Catalog** per outlet
- **Shopping Cart** dengan persisten state
- **Checkout Process**
- **Order Management**
- **Payment Integration** (Midtrans)

### **7. 📊 Transaction & Orders**
- **Order Queue** management
- **Order Status** update
- **Transaction History**
- **Payment Tracking**

### **8. 💰 Financial Management**
- **Expense Tracking** per outlet
- **Daily Reports**
- **Revenue Analytics**
- **Withdrawal Requests**
- **Financial Calculations**

### **9. 📈 Reports & Analytics**
- **Daily Reports** per outlet
- **Sales Analytics**
- **Business Performance** metrics
- **Financial Summaries**

### **10. 🗺️ Maps & Location**
- **Interactive Maps** dengan Leaflet
- **Outlet Location** display
- **Distance Calculation**
- **Geolocation Services**

---

## � **API Endpoints & Usage**

### **🔐 Authentication APIs**
```typescript
// Login
POST /auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

// Get User Profile
GET /auth/me
Headers: { Authorization: "Bearer {token}" }
Response: { user: User, business: Business, outlets: Outlet[] }

// Update Profile
PUT /user/profile
Body: { name?: string, phone?: string, avatar?: string }
```

### **🏢 Business APIs**
```typescript
// Get Business Profile
GET /business/my/business
Response: { business: Business }

// Update Business
PATCH /business/{id}
Body: { name?: string, description?: string, bankAccount?: string }
```

### **🏪 Outlet APIs**
```typescript
// Get Outlets by Business
GET /outlets/business/{businessId}
Query: { take?: number, limit?: number, search?: string }
Response: { outlets: Outlet[] }

// Get Single Outlet
GET /outlets/{outletId}
Response: { outlet: Outlet }

// Create Outlet
POST /outlets
Body: { name: string, address: string, phone: string, businessId: string }

// Update Outlet
PATCH /outlets/{outletId}
Body: { name?: string, address?: string, phone?: string }

// Delete Outlet
DELETE /outlets/{outletId}
```

### **📦 Product APIs**
```typescript
// Get Products by Outlet
GET /products/outlet/{outletId}
Response: { products: Product[] }

// Get Single Product
GET /products/{productId}
Response: { product: Product }

// Create Product
POST /products
Body: { name: string, price: number, type: "GOODS"|"SERVICE", outletId: string }

// Update Product
PATCH /products/{productId}
Body: { name?: string, price?: number, stock?: number }

// Delete Product
DELETE /products/{productId}

// Bulk Import Products
POST /products/bulk
Body: FormData (Excel file)

// Get Import Template
GET /products/template/import
Response: Excel file download
```

### **📅 Booking APIs**
```typescript
// Get Product Bookings
GET /bookings/product/{productId}
Response: { bookings: Booking[] }

// Create Booking
POST /bookings
Body: { productId: string, slotId: string, customerData: object }

// Update Booking Status
PATCH /bookings/{bookingId}
Body: { status: "CONFIRMED"|"CANCELLED"|"COMPLETED" }
```

### **🛒 Order APIs**
```typescript
// Get Orders by Outlet
GET /orders/outlet/{outletId}
Query: { status?: string, limit?: number }
Response: { orders: Order[] }

// Update Order Status
PATCH /orders/{orderId}/status
Body: { status: "PENDING"|"CONFIRMED"|"PREPARING"|"READY"|"DELIVERED" }

// Get Order Details
GET /orders/{orderId}
Response: { order: Order }
```

### **📊 Transaction APIs**
```typescript
// Get Transactions by Outlet
GET /transactions/outlet/{outletId}
Query: { startDate?: string, endDate?: string }
Response: { transactions: Transaction[] }
```

### **💰 Expense APIs**
```typescript
// Get Expenses by Outlet
GET /expenses/outlet/{outletId}
Response: { expenses: Expense[] }

// Create Expense
POST /expenses
Body: { description: string, amount: number, outletId: string, date: string }

// Update Expense
PUT /expenses/{expenseId}
Body: { description?: string, amount?: number }

// Delete Expense
DELETE /expenses/{expenseId}
```

### **📈 Reports APIs**
```typescript
// Get Daily Report
GET /reports/daily/{outletId}
Query: { date?: string }
Response: { 
  totalSales: number, 
  totalOrders: number, 
  totalExpenses: number,
  profit: number 
}
```

### **💸 Withdrawal APIs**
```typescript
// Get Withdrawal Calculation
GET /withdrawals/business/{businessId}/calculation
Response: { 
  availableAmount: number, 
  pendingAmount: number,
  totalRevenue: number 
}

// Request Withdrawal
POST /withdrawals/business/{businessId}/request
Body: { amount: number, bankAccount: string }
```

### **📤 Upload APIs**
```typescript
// Upload Image
POST /upload/image
Body: FormData (image file)
Response: { url: string }

// Delete Image
DELETE /upload/image
Body: { url: string }
```

---

## 🔄 **API Response Format**

Semua API menggunakan format response standar:
```typescript
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
  path: string
}
```

**Error Response:**
```typescript
{
  success: false,
  message: "Error message",
  errors?: ValidationError[],
  timestamp: string,
  path: string
}
```

---

## �️ **Authentication & Security**

### **Headers Required:**
```typescript
{
  "Authorization": "Bearer {jwt_token}",
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true" // untuk development
}
```

### **Protected Routes:**
- Semua `/umkm/*` routes → role: OWNER + verified
- `/business/*` → role: OWNER/ADMIN
- `/orders/*` → authenticated users
- `/upload/*` → authenticated users

---

## � **Configuration**

### **API Base URL:**
```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:4444/api/v1
# atau
NUXT_PUBLIC_API_BASE_URL=https://cheaply-full-leech.ngrok-free.app/api/v1
```

### **Payment Gateway:**
```env
NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

---

## 📱 **User Flow**

1. **Registration** → Email Verification → Business Setup
2. **Login** → Dashboard → Select Outlet → Manage Operations
3. **Customer**: Browse Outlets → Add to Cart → Checkout → Payment
4. **Owner**: Monitor Orders → Update Status → Track Analytics

---

**Last Updated**: September 10, 2025  
**Frontend**: Nuxt 3.17.5  
**Backend API**: Express.js + Prisma
