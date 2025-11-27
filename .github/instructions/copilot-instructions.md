---
applyTo: "**"
---

# AI Agent Instructions for BOSS Project

## 🎯 Project Overview

**BOSS (Business One Stop System)** is a comprehensive UMKM (Micro, Small, Medium Enterprise) management platform with multi-service architecture supporting business operations, e-commerce, payment processing, and real-time communications.

### Architecture Overview

- **Backend**: Express.js + TypeScript + Prisma ORM + PostgreSQL
- **Frontend-Customer**: Next.js 15 + React 19 + TanStack React Query + PWA
- **Dashboard**: Next.js 15 + React 19 + TanStack React Query (Admin/Owner panel)
- **Frontend**: Nuxt.js 3 + Vue.js + Pinia (UMKM management)
- **Consumer**: RabbitMQ message processor for notifications
- **Email-Service**: SMTP email handling service
- **Infrastructure**: Docker + Redis + RabbitMQ + Elasticsearch

---

## 📁 Project Structure

```
project-boss/
├── backend/                    # Express.js API server
├── frontend-customer/          # Next.js customer-facing app
├── dashboard/                  # Next.js admin dashboard
├── frontend/                   # Nuxt.js UMKM management
├── consumer/                   # RabbitMQ message processor
├── email-service/             # Email service
├── docker-compose.*.yml       # Docker orchestration
├── .github/workflows/         # CI/CD pipelines
└── uploads/                   # File storage
```

---

## 🔧 Development Environment

### Quick Start Commands

```bash
# Development with Docker
docker-compose -f docker-compose.dev.yml up -d

# Backend development
cd backend && npm run dev

# Frontend-customer development
cd frontend-customer && npm run dev

# Dashboard development
cd dashboard && npm run dev

# Frontend (Nuxt) development
cd frontend && npm run dev
```

### Environment Files Required

- `.env.backend` - Backend configuration
- `.env.frontend-customer` - Next.js customer app
- `.env.dashboard` - Admin dashboard
- `.env.consumer` - Message consumer
- `.env` files for each service

### Database Operations

```bash
# Prisma operations (in backend/)
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (dev only)
```

---

## 🏗️ Backend Patterns

### Authentication System

- **JWT-based authentication** with HS256 algorithm
- **Middleware pattern**: `AuthMiddleware.validateJWT()`
- **Role-based access**: OWNER, ADMIN, USER roles
- **Socket.IO authentication** with JWT verification

```typescript
// JWT utility pattern
export const JwtUtil = {
    generate(payload: any, expiresIn: any = '1D'): string,
    verify<T>(token: string): T,
    decode(token: string): any
}

// Auth middleware usage
router.get('/protected', AuthMiddleware.validateJWT, controller.method);
```

### Database Patterns

- **Prisma ORM** with PostgreSQL
- **Hierarchical relationships**: User → Business → Outlet → Product
- **Soft deletes** where applicable
- **UUID primary keys** for all entities
- **Audit fields**: createdAt, updatedAt on all models

```typescript
// Key relationships
User 1:N Business 1:N Outlet 1:N Product
User 1:N Order
Outlet 1:N Transaction
Product 1:N OrderItem
```

### API Response Pattern

```typescript
// Standard response format
{
  success: boolean,
  message: string,
  data?: any,
  error?: string
}

// Pagination response
{
  success: true,
  data: [...],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### Error Handling

- **AppError class** for structured errors
- **Global error middleware** for consistent responses
- **Validation with Joi** for request data
- **Try-catch wrapping** for async operations

### File Upload

- **Multer** for file handling
- **Public uploads** directory for static files
- **Image validation** and size limits
- **URL construction** for uploaded files

---

## 🎨 Frontend-Customer Patterns (Next.js)

### State Management

- **TanStack React Query v5** for server state
- **Local state** with useState for UI state
- **localStorage** for cart persistence and payment data
- **Context providers** for global state

### Hook Patterns

```typescript
// Factory pattern for API hooks
export const useUsers = () =>
  useReactQuery({
    queryKey: ["users"],
    queryFn: () => UserService.getUsers(),
  });

// Enhanced hook with error handling
const useReactQuery = <T>(options: UseQueryOptions<T>) => {
  return useQuery<T>({
    ...options,
    onError: (error) => toast.error(error.message),
  });
};
```

### Payment Integration

- **Midtrans payment gateway** with multiple methods
- **Dynamic fee calculation** based on payment method
- **Payment flow**: Checkout → Payment → Processing → Success/Failure
- **QR code support** for QRIS payments
- **Transaction status polling** for payment updates

```typescript
// Fee calculation pattern
const calculateFees = useMemo(() => {
  if (!selectedPaymentMethod) return { transactionFee: 0, applicationFee: 0 };

  const transactionFee =
    selectedPaymentMethod.category === "QRIS"
      ? Math.ceil(subtotal * 0.007)
      : 4000;
  const applicationFee = Math.max(Math.ceil(subtotal * 0.03), 1000);

  return { transactionFee, applicationFee };
}, [subtotal, selectedPaymentMethod]);
```

### Component Patterns

- **Shadcn/UI components** for consistent design
- **Compound components** for complex UI elements
- **Custom hooks** for business logic separation
- **Error boundaries** for graceful error handling

### PWA Features

- **Service worker** for offline capability
- **Push notifications** support
- **App manifest** for installable experience
- **Caching strategies** for performance

---

## 📊 Dashboard Patterns (Next.js Admin)

### Data Management

- **Factory pattern hooks** for CRUD operations
- **Optimistic updates** for better UX
- **Bulk operations** support
- **Export functionality** (CSV, Excel)

```typescript
// Factory pattern example
export const useUserV2 = () => ({
  useUserList: (params?: UserListParams) =>
    useReactQuery({
      queryKey: ["users", params],
      queryFn: () => UserService.getUsers(params),
    }),

  createUser: () =>
    useCreateMutation({
      mutationFn: UserService.createUser,
      invalidateQueries: [["users"]],
    }),

  // ... other CRUD operations
});
```

### Admin Features

- **Role-based dashboard** (ADMIN/OWNER access)
- **User management** with CRUD operations
- **Business analytics** and reporting
- **System monitoring** capabilities

---

## 🖼️ Frontend (Nuxt.js) Patterns

### State Management

- **Pinia stores** for global state
- **Composables** for reusable logic
- **SSR-compatible** state handling
- **Persistent state** where needed

### Testing

- **Playwright** for E2E testing
- **Test scenarios**: Auth, Product CRUD, Outlet management
- **Page object pattern** for maintainable tests

```typescript
// E2E test pattern
test.beforeEach(async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByPlaceholder("contoh@email.com").fill("john@coffeeshop.com");
  await page.getByPlaceholder("Masukkan password").fill("password123");
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL("/umkm/products");
});
```

---

## 🔄 Message Queue Patterns

### RabbitMQ Integration

- **Publisher-Consumer pattern** for async operations
- **Email notifications** via message queues
- **Payment confirmations** processing
- **WhatsApp notifications** via Twilio

```typescript
// Message publisher pattern
export const messagePublisher = {
  publishEmailVerification: (email: string, token: string) =>
    publishMessage("email.verification", { email, token }),

  publishWhatsAppPaymentSuccess: (orderId: string) =>
    publishMessage("whatsapp.payment.success", { orderId }),
};
```

---

## 🧪 Testing Patterns

### Backend Testing

- **Jest** for unit and integration tests
- **Supertest** for API testing
- **Test database** isolation
- **Coverage reports** with meaningful thresholds

```typescript
// Integration test pattern
describe("User Routes", () => {
  beforeEach(async () => {
    await db.user.deleteMany();
  });

  it("should create a new user", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
  });
});
```

### Frontend Testing

- **Playwright** for E2E testing across applications
- **Component testing** where applicable
- **User flow testing** for critical paths

### Utility Testing

- **Socket.IO testing** with connection validation
- **Elasticsearch testing** with index management
- **Payment testing** pages for manual validation

---

## 🚀 Deployment & CI/CD

### Docker Strategy

- **Multi-stage builds** for optimized images
- **Service-specific Dockerfiles** for each application
- **Docker Compose** for local development and production
- **Build context optimization** to minimize image size

### CI/CD Pipeline

- **GitHub Actions** for automated deployment
- **Path-based triggers** for service-specific builds
- **Docker Hub** for image storage
- **VPS deployment** with automatic service updates

```yaml
# Deployment pattern
- name: Check for changes
  uses: dorny/paths-filter@v2
  with:
    filters: |
      backend: 'backend/**'
      frontend-customer: 'frontend-customer/**'
      dashboard: 'dashboard/**'
```

### Environment Management

- **Development**: `docker-compose.dev.yml`
- **Production**: `docker-compose.prod.yml`
- **Local**: `docker-compose.local.yml`
- **Service-specific** environment files

---

## 🔍 Search & Analytics

### Elasticsearch Integration

- **Product search** with full-text capabilities
- **Outlet search** with location-based queries
- **Index management** with automated setup
- **Search testing** utilities for validation

---

## 📱 Real-time Features

### Socket.IO Implementation

- **Authenticated connections** with JWT
- **Business room** subscriptions
- **Order tracking** for customers
- **Admin notifications** for real-time updates

```typescript
// Socket patterns
socket.on("join:business", (businessId) => {
  socket.join(`business:${businessId}`);
});

io.to(`business:${businessId}`).emit("order:new", orderData);
```

---

## 🔐 Security Patterns

### Authentication & Authorization

- **JWT tokens** with secure algorithms
- **Role-based access control** throughout the system
- **Environment variable** protection for secrets
- **CORS configuration** for cross-origin requests

### Data Validation

- **Joi schemas** for request validation
- **Type safety** with TypeScript
- **Input sanitization** for security
- **Error message** sanitization

---

## 📝 Code Style & Standards

### General Guidelines

- **TypeScript** for type safety across services
- **ESLint + Prettier** for code formatting
- **Conventional commits** for version control
- **Documentation** in markdown format

### Naming Conventions

- **camelCase** for variables and functions
- **PascalCase** for components and classes
- **kebab-case** for file names
- **SCREAMING_SNAKE_CASE** for constants

### Database Conventions

- **Prisma schema** as single source of truth
- **Migration files** for database changes
- **Seed files** for development data
- **UUID** for primary keys

---

## ⚡ Performance Patterns

### Database Optimization

- **Query optimization** with Prisma
- **Pagination** for large datasets
- **Indexing** for frequently queried fields
- **Connection pooling** for database access

### Frontend Optimization

- **React Query** for efficient data fetching
- **Image optimization** with Next.js
- **Code splitting** for bundle optimization
- **Caching strategies** for static content

---

## 🚨 Error Handling & Monitoring

### Error Patterns

- **Structured error responses** across all services
- **Error logging** with Winston
- **Error boundaries** in React applications
- **Graceful degradation** for service failures

### Monitoring

- **Health checks** for all services
- **Log aggregation** with structured logging
- **Performance monitoring** for critical paths

---

## 🔧 Development Workflow

### Branch Strategy

- **develop** branch for development
- **main/master** for production
- **Feature branches** for new development
- **Conventional commits** for clear history

### Code Review Process

- **Pull request** reviews required
- **Automated testing** before merge
- **Deployment** triggers on merge to develop
- **Rollback procedures** for failed deployments

---

## 📋 Common Tasks & Commands

### Daily Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service]

# Database operations
cd backend && npm run db:migrate && npm run db:seed

# Run tests
npm test                    # Backend
npx playwright test         # Frontend E2E
```

### Troubleshooting

```bash
# Reset development environment
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build

# Check service health
docker-compose -f docker-compose.dev.yml ps

# Access service logs
docker logs [container-name] -f
```

### Production Deployment

- **Automatic deployment** via GitHub Actions on push to develop
- **Service-specific rebuilds** based on changed files
- **Zero-downtime deployment** strategy
- **Health checks** before service switching

---

This documentation provides comprehensive guidance for AI agents working on the BOSS project. Follow these patterns and conventions to maintain consistency and code quality across all services.

Selalu gunkan bahasa indonesia untuk melakukan penjelasan
