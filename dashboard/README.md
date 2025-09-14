# 🚀 BOSS Dashboard - UMKM Management System

Dashboard frontend untuk sistem manajemen UMKM BOSS yang dibangun dengan **Next.js 15**, **TypeScript**, dan **Tailwind CSS**.

## 📋 Fitur Dashboard

### 🏪 **Sidebar Navigation**
- **Logo BOSS** di bagian atas
- **Outlet Selector** - Switching per outlet
- **Menu Navigation:**
  - Dashboard (Overview & Analytics)
  - Produk dan Layanan
  - Stok Produk
  - Pesanan
  - Antrian
  - Laporan
  - Pengeluaran
  - Riwayat Transaksi
  - Penarikan Dana

### 📊 **Dashboard Home**
- Statistics cards (Sales, Orders, Expenses, Profit)
- Top Products display
- Quick Actions buttons
- Business performance overview

### 🔧 **Header Features**
- Mobile responsive hamburger menu
- User profile dropdown
- Account name display
- Notifications bell
- Logout functionality

## 🛠 **Technology Stack**

- **Framework:** Next.js 15 (with Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Fonts:** Poppins (Google Fonts)
- **Icons:** Heroicons (SVG)
- **Authentication:** JWT Token
- **API:** REST API integration

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 4444

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to dashboard folder
cd dashboard

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables
```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:4444/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:4444/api/v1

# Application Environment
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=BOSS Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0

# Midtrans Configuration (Optional)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-_BxOLfo7ZCtihmRR

# Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Development Settings
NEXT_PUBLIC_DEBUG=true
```

## 📁 **Project Structure**

```
dashboard/
├── app/                    # Next.js 15 App Router
│   ├── dashboard/         # Dashboard pages
│   │   ├── page.tsx      # Dashboard home
│   │   ├── products/     # Products management
│   │   ├── stock/        # Stock management
│   │   ├── orders/       # Orders management
│   │   ├── queue/        # Queue management
│   │   ├── reports/      # Reports & Analytics
│   │   ├── expenses/     # Expenses tracking
│   │   ├── transactions/ # Transaction history
│   │   └── withdrawals/  # Fund withdrawals
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/            # Reusable components
│   └── layout/           # Layout components
│       ├── DashboardLayout.tsx # Main dashboard layout
│       ├── Sidebar.tsx   # Navigation sidebar
│       └── Header.tsx    # Top header
├── public/               # Static assets
│   └── Logo Boss.png     # BOSS logo
├── .env.local           # Environment variables
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## 🎨 **Design System**

### Colors
- **Primary:** Red (#DC2626, #EF4444)
- **Secondary:** Gray (#6B7280, #9CA3AF)
- **Success:** Green (#059669, #10B981)
- **Warning:** Yellow (#D97706, #F59E0B)
- **Error:** Red (#DC2626, #EF4444)

### Typography
- **Font Family:** Poppins (Google Fonts)
- **Font Weights:** 300, 400, 500, 600, 700

### Components
- **Cards:** White background, subtle shadows, rounded corners
- **Buttons:** Consistent padding, hover states, focus rings
- **Forms:** Clean inputs with focus states
- **Sidebar:** Fixed width, responsive collapse on mobile

## 📱 **Responsive Design**

- **Mobile:** Collapsible sidebar, mobile-optimized navigation
- **Tablet:** Adaptive layout, touch-friendly elements
- **Desktop:** Full sidebar, optimized for productivity

## 🔐 **Authentication Flow**

1. **Login:** JWT token stored in localStorage
2. **Protected Routes:** Automatic redirect to login if not authenticated
3. **User Context:** User data available throughout the app
4. **Logout:** Clear tokens and redirect to login

## 🌐 **API Integration**

Dashboard terintegrasi dengan BOSS Backend API:
- **Base URL:** `http://localhost:4444/api/v1`
- **Authentication:** Bearer token in headers
- **Endpoints:** Sesuai dengan API Documentation

### Key API Endpoints Used:
- `GET /auth/me` - Get current user data
- `GET /outlets/business/:businessId` - Get business outlets
- `GET /dashboard/business/:businessId` - Get dashboard stats
- `GET /products/outlet/:outletId` - Get products by outlet
- `GET /orders/:outletId/goods` - Get orders by outlet

## 📊 **Dashboard Features (Implementation Status)**

### ✅ **Completed**
- [x] Dashboard layout with sidebar and header
- [x] Outlet selector functionality
- [x] Navigation menu
- [x] Basic dashboard statistics
- [x] Authentication flow
- [x] Responsive design
- [x] Empty state pages for all menu items

### 🔄 **In Progress**
- [ ] Real-time data fetching
- [ ] Product management CRUD
- [ ] Order management system
- [ ] Stock tracking
- [ ] Expense management
- [ ] Reports and analytics
- [ ] Queue management
- [ ] Transaction history
- [ ] Withdrawal system

### 📅 **Planned**
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Export functionality
- [ ] Bulk operations
- [ ] Advanced filters
- [ ] Mobile app version

## 🚀 **Deployment**

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t boss-dashboard .

# Run container
docker run -p 3000:3000 boss-dashboard
```

## 🧪 **Testing**

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 **Troubleshooting**

### Common Issues

**API Connection Issues:**
- Ensure backend API is running on port 4444
- Check API_BASE_URL in .env.local
- Verify CORS settings in backend

**Authentication Issues:**
- Clear localStorage and re-login
- Check JWT token expiration
- Verify API endpoints

**Build Issues:**
- Clear .next folder and rebuild
- Check TypeScript errors
- Verify all dependencies are installed

## 📞 **Support**

For technical support:
- Documentation: See API_DOCUMENTATION.md
- Issues: Create GitHub issue
- Email: support@boss-umkm.com

---

**Last Updated:** September 10, 2025  
**Version:** 1.0.0  
**Built with:** Next.js 15 + TypeScript + Tailwind CSS

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
