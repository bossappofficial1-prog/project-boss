import {
  LayoutDashboard,
  Package,
  Box,
  ShoppingBag,
  Clock,
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
}

interface SubMenuItem {
  name: string;
  href: string;
  badge?: string;
  requiredTypes?: OutletType[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Utama",
    items: [
      {
        id: "overview",
        name: "Ringkasan",
        href: "/owner/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "business-analytics",
        name: "Analitik Bisnis",
        href: "/owner/dashboard/business",
        icon: TrendingUp,
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
        href: "/owner/dashboard/outlets",
      },
      {
        id: "kelola-outlet",
        icon: StoreIcon,
        name: "Kelola Outlet",
        href: "/owner/dashboard/outlets/manage",
      },
      {
        id: "kelola-kasir",
        icon: UsersIcon,
        name: "Kelola Kasir",
        href: "/owner/dashboard/outlets/staff",
      },
      {
        id: "transfer-outlet",
        icon: ArrowRightLeft,
        name: "Transfer Outlet",
        href: "/owner/dashboard/outlets/transfer",
      },
      {
        id: "kelola-meja",
        icon: LayoutGrid,
        name: "Manajemen Meja",
        href: "/owner/dashboard/outlets/manage/tables",
        requiredTypes: [OutletType.FNB, OutletType.CUSTOM],
      },
    ],
  },
  {
    label: "Inventori",
    items: [
      {
        id: "products",
        name: "Produk & Layanan",
        href: "/owner/dashboard/products",
        icon: Package,
      },
      {
        id: "stock",
        name: "Stok Produk",
        href: "/owner/dashboard/stock",
        icon: Box,
        requiredTypes: [OutletType.RETAIL, OutletType.FNB, OutletType.CUSTOM],
      },
    ],
  },
  {
    label: "Manajemen Pelanggan",
    items: [
      {
        id: "customers",
        name: "Data Pelanggan",
        href: "/owner/dashboard/customers",
        icon: UserCheck,
      },
      {
        id: "loyalty",
        name: "Loyalty & Poin",
        href: "/owner/dashboard/loyalty",
        icon: Gift,
      },
    ],
  },
  {
    label: "Transaksi",
    items: [
      {
        id: "orders",
        name: "Daftar Pesanan",
        href: "/owner/dashboard/orders",
        icon: ShoppingBag,
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        id: "reports",
        name: "Laporan Keuangan",
        href: "/owner/dashboard/reports",
        icon: FileText,
      },
      {
        id: "expenses",
        name: "Pengeluaran",
        href: "/owner/dashboard/expenses",
        icon: TrendingDown,
      },
      {
        id: "transactions",
        name: "Riwayat Transaksi",
        href: "/owner/dashboard/transactions",
        icon: Receipt,
      },
    ],
  },
];
