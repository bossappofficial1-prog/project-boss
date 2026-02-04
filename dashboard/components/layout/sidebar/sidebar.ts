import {
  LayoutDashboard,
  Store,
  Package,
  Box,
  ShoppingBag,
  Clock,
  FileText,
  TrendingDown,
  Receipt,
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
        id: "dashboard",
        name: "Dashboard",
        href: "/owner/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Manajemen Outlet",
    items: [
      {
        id: "outlet",
        name: "Outlet",
        icon: Store,
        subItems: [
          { name: "Dashboard Outlet", href: "/owner/dashboard/outlets" },
          { name: "Kelola Outlet", href: "/owner/dashboard/outlets/manage" },
          { name: "Kelola Kasir", href: "/owner/dashboard/outlets/staff" },
        ],
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
  {
    label: "Transaksi",
    items: [
      {
        id: "pos",
        name: "Point of Sale",
        href: "/owner/dashboard/pos",
        icon: ShoppingBag,
      },
      {
        id: "pob",
        name: "Point of Buy",
        href: "/owner/dashboard/pob",
        icon: ShoppingBag,
      },
      {
        id: "orders",
        name: "Lihat Pesanan",
        href: "/owner/dashboard/orders",
        icon: ShoppingBag,
      },
      {
        id: "queue",
        name: "Antrian",
        href: "/owner/dashboard/queue",
        icon: Clock,
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        id: "reports",
        name: "Laporan",
        icon: FileText,
        subItems: [
          {
            name: "Laporan Outlet",
            href: "/owner/dashboard/reports/outlet",
          },
          {
            name: "Laporan Staff",
            href: "/owner/dashboard/reports/staff",
          },
        ],
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
