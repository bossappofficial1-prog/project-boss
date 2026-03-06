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
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  name: string;
  href: string;
  badge?: string;
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
        id: "owner-dashboard",
        name: "Overview",
        href: "/owner/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "overview",
        name: "Dashboard Bisnis",
        href: "/owner/dashboard/business",
        icon: LayoutDashboard,
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
      },
    ],
  },
  // {
  //   label: "Transaksi",
  //   items: [
  //     {
  //       id: "pos",
  //       name: "Point of Sale",
  //       href: "/owner/dashboard/pos",
  //       icon: ShoppingBag,
  //     },
  //     {
  //       id: "pob",
  //       name: "Point of Buy",
  //       href: "/owner/dashboard/pob",
  //       icon: ShoppingBag,
  //     },
  //     {
  //       id: "orders",
  //       name: "Lihat Pesanan",
  //       href: "/owner/dashboard/orders",
  //       icon: ShoppingBag,
  //     },
  //     {
  //       id: "queue",
  //       name: "Antrian",
  //       href: "/owner/dashboard/queue",
  //       icon: Clock,
  //     },
  //   ],
  // },
  {
    label: "Keuangan",
    items: [
      {
        id: "reports",
        name: "Laporan Keuangan",
        href: "/owner/dashboard/reports/outlet",
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
