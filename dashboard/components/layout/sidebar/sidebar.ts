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
        href: "/owner",
        icon: LayoutDashboard,
      },
      {
        id: "business-analytics",
        name: "Analitik Bisnis",
        href: "/owner/analytics",
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
    label: "Keuangan",
    items: [
      {
        id: "reports",
        name: "Laporan Keuangan",
        href: "/owner/reports",
        icon: FileText,
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
      },
      {
        id: "business-health",
        icon: Activity,
        name: "Kesehatan Bisnis",
        href: "/owner/business-health",
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
      },
      {
        id: "calculator-bep",
        icon: BarChart2,
        name: "Kalkulator BEP",
        href: "/owner/calculator-bep",
      },
      {
        id: "sales-target-breakdown",
        icon: Target,
        name: "Sales Target Breakdown",
        href: "/owner/sales-target-breakdown",
      },
    ],
  },
];
