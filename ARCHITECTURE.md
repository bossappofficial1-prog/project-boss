# BOSS - Business One Stop System
## Architecture Documentation

### 📋 Project Overview
BOSS adalah platform manajemen bisnis terpadu untuk UMKM Indonesia yang menggabungkan transaksi QRIS, booking service, multi outlet, dan dompet bisnis dalam satu aplikasi.

### 🏗️ System Architecture

#### Frontend Architecture
```
src/
├── app/                     # Next.js 14 App Router
│   ├── (landing)/          # Landing page group
│   │   ├── page.tsx        # Main landing page
│   │   └── layout.tsx      # Landing layout
│   ├── (guest)/           # Guest customer pages
│   │   ├── page.tsx       # Home/Explorer
│   │   ├── outlet/        # Outlet detail pages
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Checkout process
│   │   └── history/       # Order history
│   ├── (owner)/           # Business owner dashboard
│   │   ├── dashboard/     # Main dashboard
│   │   ├── products/      # Product management
│   │   ├── bookings/      # Booking management
│   │   ├── transactions/  # Transaction management
│   │   ├── wallet/        # Wallet management
│   │   ├── staff/         # Staff management
│   │   ├── statistics/    # Analytics & reports
│   │   └── settings/      # Business settings
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layouts/          # Layout components
│   └── features/         # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # API services
├── stores/               # State management (Zustand)
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

#### Backend Architecture (Existing)
```
backend/
├── src/
│   ├── controller/       # API controllers
│   ├── service/          # Business logic
│   ├── repositories/     # Data access layer
│   ├── middleware/       # Express middleware
│   ├── routes/           # Route definitions
│   ├── schemas/          # Validation schemas
│   └── utils/            # Utility functions
├── prisma/              # Database schema & migrations
└── tests/               # Test files
```

### 🎨 Design System

#### Color Palette
```css
/* Primary Colors */
--boss-red: #B91C1C;           /* Main brand color */
--boss-red-dark: #991B1B;      /* Hover states */
--boss-red-light: #DC2626;     /* Accents */

/* Neutral Colors */
--boss-gray-50: #F9FAFB;       /* Backgrounds */
--boss-gray-100: #F3F4F6;      /* Light backgrounds */
--boss-gray-200: #E5E7EB;      /* Borders */
--boss-gray-300: #D1D5DB;      /* Dividers */
--boss-gray-400: #9CA3AF;      /* Placeholders */
--boss-gray-500: #6B7280;      /* Secondary text */
--boss-gray-600: #4B5563;      /* Primary text */
--boss-gray-700: #374151;      /* Headers */
--boss-gray-800: #1F2937;      /* Dark backgrounds */
--boss-gray-900: #111827;      /* Darkest text */

/* Status Colors */
--success: #10B981;            /* Success states */
--warning: #F59E0B;            /* Warning states */
--error: #EF4444;              /* Error states */
--info: #3B82F6;               /* Info states */
```

#### Typography Scale
```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### 🔧 Tech Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components + Headless UI
- **Icons**: Heroicons + Custom SVGs
- **Charts**: Recharts

#### Backend (Existing)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Payment**: Midtrans
- **File Upload**: Multer + Cloud Storage
- **Queue**: Redis + Bull

### 📱 User Flows

#### Guest Customer Flow
1. **Landing Page** → Explore outlets without login
2. **Outlet Explorer** → Browse nearby outlets & services
3. **Product/Service Selection** → Add to cart or book service
4. **Checkout** → Enter customer info (name, phone)
5. **Payment** → QRIS payment via Midtrans
6. **Order Tracking** → Track order status via phone number

#### Business Owner Flow
1. **Registration** → Create business account
2. **Business Setup** → Complete business profile
3. **Outlet Management** → Add outlets & operating hours
4. **Product/Service Management** → Add products/services
5. **Staff Management** → Add staff and assign roles
6. **Order Management** → Process incoming orders
7. **Analytics** → View business statistics
8. **Wallet Management** → Withdraw earnings

### 🗂️ Database Schema (Simplified)

#### Core Entities
```
User (Business Owner)
├── Business
    ├── Outlets[]
    │   ├── Products[]
    │   ├── Staff[]
    │   └── OperatingHours[]
    ├── Orders[]
    ├── Wallet
    └── Memberships[]

GuestCustomer
└── Orders[]

Order
├── OrderItems[]
├── Transaction
└── BookingSlot (for services)
```

### 🚀 Implementation Phases

#### Phase 1: Core Foundation (Week 1-2)
- [ ] Setup project structure
- [ ] Design system implementation
- [ ] Basic UI components
- [ ] Landing page
- [ ] Guest customer flow (browse outlets)
- [ ] Basic owner dashboard

#### Phase 2: Core Features (Week 3-4)
- [ ] Product/Service management
- [ ] Shopping cart functionality
- [ ] Checkout process
- [ ] Payment integration (QRIS)
- [ ] Order management
- [ ] Basic booking system

#### Phase 3: Advanced Features (Week 5-6)
- [ ] Staff management
- [ ] Membership system
- [ ] Analytics dashboard
- [ ] Wallet management
- [ ] Advanced booking (time slots)
- [ ] Order ID formatting

#### Phase 4: Enhancement (Week 7-8)
- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Documentation
- [ ] Deployment setup

### 📊 Key Features Implementation

#### Shopping Cart System
```typescript
interface CartItem {
  id: string
  productId: string
  outletId: string
  quantity: number
  price: number
  type: 'GOODS' | 'SERVICE'
  bookingSlot?: BookingSlot
}

interface Cart {
  items: CartItem[]
  total: number
  fees: {
    midtransFee: number
    appFee: number
  }
}
```

#### Booking System
```typescript
interface BookingSlot {
  id: string
  productId: string
  date: Date
  startTime: Date
  endTime: Date
  staffId?: string
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'
}
```

#### Order Management
```typescript
interface Order {
  id: string // Format: DDMMYYYYNN (e.g., 0208202501)
  customerId: string
  outletId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: 'DIGITAL' | 'CASH'
  items: OrderItem[]
  total: number
  bookingSlots?: BookingSlot[]
}
```

### 🔒 Security Considerations
- JWT authentication for business owners
- Input validation with Zod schemas
- Rate limiting on API endpoints
- Secure payment processing via Midtrans
- Data encryption for sensitive information
- CORS configuration
- Environment variable management

### 📈 Performance Optimization
- Server-side rendering with Next.js
- Image optimization
- Code splitting
- Lazy loading for heavy components
- Database query optimization
- Caching strategies (Redis)
- CDN for static assets

### 🧪 Testing Strategy
- Unit tests for utilities and services
- Integration tests for API endpoints
- Component testing with React Testing Library
- E2E testing with Playwright
- Performance testing
- Security testing

### 📚 Documentation Plan
- API documentation with OpenAPI/Swagger
- Component documentation with Storybook
- User manuals for business owners
- Developer documentation
- Deployment guides

---

## Next Steps
1. Setup development environment
2. Implement core UI components
3. Create landing page according to requirements
4. Implement guest customer flow
5. Build owner dashboard foundation
