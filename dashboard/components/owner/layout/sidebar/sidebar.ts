import {
  LayoutDashboard,
  Package,
  Box,
  ShoppingBag,
  FileText,
  TrendingDown,
  Receipt,
  CreditCard,
  LayoutDashboardIcon,
  StoreIcon,
  UsersIcon,
  UserCheck,
  Gift,
  TrendingUp,
  ArrowRightLeft,
  LayoutGrid,
  BarChart2,
  Target,
  Boxes,
  PieChart,
  Activity,
  Clock,
  CalendarDays,
  ClipboardList,
  CalendarCheck,
  Truck,
} from "lucide-react";
import { OutletType } from "@/types";

interface MenuItem {
  id: string;
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: SubMenuItem[];
  requiredTypes?: OutletType[];
  requirePro?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface SubMenuItem {
  name: string;
  href: string;
  badge?: string;
  requiredTypes?: OutletType[];
  requirePro?: boolean;
  disabled?: boolean;
}

export interface MenuGroup {
  label: string;
  showOn?: OutletType[];
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Utama",
    items: [
      {
        id: "overview",
        name: "Ringkasan",
        href: "/owner",
        icon: LayoutDashboard,
      },
      {
        id: "business-analytics",
        name: "Analitik Bisnis",
        href: "/owner/analytics",
        icon: TrendingUp,
        requirePro: true,
      },
      {
        id: "subscription",
        name: "Langganan",
        href: "/owner/subscription",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Manajemen Outlet",
    items: [
      {
        id: "dashboard-outlet",
        icon: LayoutDashboardIcon,
        name: "Dashboard Outlet",
        href: "/owner/outlets",
      },
      {
        id: "kelola-outlet",
        icon: StoreIcon,
        name: "Kelola Outlet",
        href: "/owner/outlets-manage",
      },
      {
        id: "kelola-kasir",
        icon: UsersIcon,
        name: "Kelola Kasir",
        href: "/owner/outlets-staff",
      },
      {
        id: "transfer-outlet",
        icon: ArrowRightLeft,
        name: "Transfer Outlet",
        href: "/owner/outlets-transfer",
      },
      {
        id: "kelola-meja",
        icon: LayoutGrid,
        name: "Manajemen Meja",
        href: "/owner/outlets-manage-tables",
        requiredTypes: [OutletType.FNB],
        requirePro: true,
      },
      {
        id: "reservations",
        icon: CalendarCheck,
        name: "Reservasi Meja",
        href: "/owner/reservations",
        requiredTypes: [OutletType.FNB, OutletType.CUSTOM],
        requirePro: true,
      },
    ],
  },
  {
    label: "Inventori",
    items: [
      {
        id: "products",
        name: "Produk & Layanan",
        href: "/owner/products",
        icon: Package,
      },
      {
        id: "stock",
        name: "Stok Produk",
        href: "/owner/stock",
        icon: Box,
        requiredTypes: [OutletType.RETAIL, OutletType.FNB, OutletType.CUSTOM],
      },
      {
        id: "suppliers",
        name: "Supplier",
        href: "/owner/suppliers",
        icon: Truck,
        requiredTypes: [OutletType.RETAIL, OutletType.CUSTOM],
      },
    ],
  },
  {
    label: "Manajemen Pelanggan",
    items: [
      {
        id: "customers",
        name: "Data Pelanggan",
        href: "/owner/customers",
        icon: UserCheck,
        requiredTypes: [
          OutletType.FNB,
          OutletType.RETAIL,
          OutletType.SERVICE,
          OutletType.CUSTOM,
        ],
      },
      {
        id: "loyalty",
        name: "Loyalty & Poin",
        href: "/owner/loyalty",
        icon: Gift,
        requirePro: true,
        requiredTypes: [
          OutletType.FNB,
          OutletType.RETAIL,
          OutletType.SERVICE,
          OutletType.CUSTOM,
        ],
      },
    ],
  },
  {
    label: "Transaksi",
    items: [
      {
        id: "orders",
        name: "Daftar Pesanan",
        href: "/owner/orders",
        icon: ShoppingBag,
      },
    ],
  },
  {
    label: "Manajemen Layanan",
    showOn: [OutletType.SERVICE, OutletType.CUSTOM],
    items: [
      {
        id: "booking-calendar",
        icon: CalendarDays,
        name: "Kalender Booking",
        href: "/owner/booking-calendar",
        requiredTypes: [OutletType.SERVICE, OutletType.CUSTOM],
      },
      {
        id: "booking-list",
        icon: ClipboardList,
        name: "Daftar Booking",
        href: "/owner/bookings",
        requiredTypes: [OutletType.SERVICE, OutletType.CUSTOM],
        disabled: true,
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        id: "reports",
        name: "Laporan Keuangan",
        href: "/owner/reports",
        icon: FileText,
      },
      {
        id: "cashier-shifts",
        name: "Shift Kasir",
        href: "/owner/cashier-shifts",
        icon: Clock,
        requiredTypes: [OutletType.RETAIL, OutletType.CUSTOM],
      },
      {
        id: "expenses",
        name: "Pengeluaran",
        href: "/owner/expenses",
        icon: TrendingDown,
      },
      {
        id: "transactions",
        name: "Riwayat Transaksi",
        href: "/owner/transactions",
        icon: Receipt,
      },
    ],
  },
  {
    label: "Analitik Outlet",
    items: [
      {
        id: "profit-per-product",
        icon: PieChart,
        name: "Profit per Produk",
        href: "/owner/profit-per-product",
        requirePro: true,
      },
      {
        id: "business-health",
        icon: Activity,
        name: "Kesehatan Bisnis",
        href: "/owner/business-health",
        requirePro: true,
      },
      {
        id: "jam-ramai",
        icon: Clock,
        name: "Analisis Jam Ramai",
        href: "/owner/peak-hours",
        requirePro: true,
      },
      {
        id: "laporan-laba-rugi",
        icon: FileText,
        name: "Laporan Laba Rugi",
        href: "/owner/income-statement",
        requirePro: true,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        id: "calculator-hpp",
        icon: Boxes,
        name: "Kalkulator HPP",
        href: "/owner/calculator-hpp",
        requirePro: true,
      },
      {
        id: "calculator-bep",
        icon: BarChart2,
        name: "Kalkulator BEP",
        href: "/owner/calculator-bep",
        requirePro: true,
      },
      {
        id: "sales-target-breakdown",
        icon: Target,
        name: "Sales Target Breakdown",
        href: "/owner/sales-target-breakdown",
        requirePro: true,
      },
    ],
  },
];
