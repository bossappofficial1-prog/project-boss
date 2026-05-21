"use client";

import { useMemo } from "react";
import { useManagerContext } from "../layout";
import { useOutletAnalytics } from "@/hooks/useOutletAnalytics";
import KpiCards from "@/components/outlet/KpiCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Store,
  ShoppingBag,
  History,
  Trash2,
  Clock,
  Box,
  Users,
  ClipboardList,
  CalendarCheck,
  FileText,
  BarChart3,
  Calculator,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ManagerDashboardPage() {
  const { managerData, outletData } = useManagerContext();
  const privileges = managerData?.privileges || [];

  const { kpiCards, isLoading } = useOutletAnalytics(outletData?.id, {
    enabled: !!outletData?.id
  });

  const privilegesNormalized = useMemo(() => {
    return privileges.map((p: any) => p.privilege || p);
  }, [privileges]);

  const privilegeList = [
    {
      key: "OUTLET_MANAGEMENT",
      label: "Manajemen Outlet",
      desc: "Mengatur informasi profil outlet, jam operasional, dan kelola staff.",
      icon: Store,
      href: "/manager/outlets-manage"
    },
    {
      key: "PRODUCT_MANAGEMENT",
      label: "Manajemen Produk",
      desc: "Menambah, mengubah, dan mengontrol status produk, jasa, atau tiket.",
      icon: ShoppingBag,
      href: "/manager/products"
    },
    {
      key: "STOCK_MANAGEMENT",
      label: "Manajemen Stok",
      desc: "Mengelola stok masuk/keluar produk serta supplier outlet.",
      icon: Box,
      href: "/manager/stock"
    },
    {
      key: "CUSTOMER_MANAGEMENT",
      label: "Manajemen Pelanggan",
      desc: "Mengelola data pelanggan, program loyalty, dan poin rewards.",
      icon: Users,
      href: "/manager/customers"
    },
    {
      key: "ORDER_MANAGEMENT",
      label: "Manajemen Pesanan",
      desc: "Memantau status dan memproses daftar pesanan pelanggan.",
      icon: ClipboardList,
      href: "/manager/orders"
    },
    {
      key: "SERVICE_MANAGEMENT",
      label: "Manajemen Layanan",
      desc: "Mengatur booking calendar dan daftar antrean booking.",
      icon: CalendarCheck,
      href: "/manager/booking-calendar"
    },
    {
      key: "FINANCE_REPORTS",
      label: "Laporan Keuangan & Shift",
      desc: "Memantau laporan keuangan, shift kasir, dan pengeluaran outlet.",
      icon: FileText,
      href: "/manager/reports"
    },
    {
      key: "TRANSACTION_VIEW",
      label: "Lihat Transaksi",
      desc: "Memantau penjualan, riwayat pembayaran, serta status transaksi.",
      icon: History,
      href: "/manager/transactions"
    },
    {
      key: "TRANSACTION_DELETE",
      label: "Hapus Transaksi (Direct)",
      desc: "Melakukan penghapusan transaksi secara instan tanpa approval owner.",
      icon: Trash2,
      href: "/manager/transactions"
    },
    {
      key: "ANALYTICS",
      label: "Analitik Bisnis",
      desc: "Analisis performa, laba rugi, jam ramai, dan kesehatan bisnis.",
      icon: BarChart3,
      href: "/manager/analytics"
    },
    {
      key: "TOOLS_CALCULATOR",
      label: "Kalkulator Bisnis & Target",
      desc: "Kalkulator HPP, BEP, dan breakdown target penjualan.",
      icon: Calculator,
      href: "/manager/calculator-hpp"
    }
  ];

  const allowedPrivileges = useMemo(() => {
    return privilegeList.filter(p => privilegesNormalized.includes(p.key));
  }, [privilegesNormalized]);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Selamat Pagi";
    if (hrs < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Card */}
      <Card className="rounded-md overflow-hidden border-border/60 shadow-md bg-gradient-to-br from-background to-primary/5">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_70%_30%,rgba(var(--primary-rgb),0.03),transparent_70%)] pointer-events-none" />

          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Manager Area</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {getGreeting()}, <span className="text-primary">{managerData?.name}</span>!
            </h1>
            <p className="text-sm text-muted-foreground/80 max-w-xl font-medium">
              Selamat bertugas kembali. Anda memiliki kontrol penuh atas outlet operasional Anda berdasarkan hak akses privilege yang telah diberikan oleh Owner.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 bg-background/60 backdrop-blur-md border border-border/40 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Outlet Aktif</span>
            <span className="text-lg font-bold text-foreground truncate max-w-48">{outletData?.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={outletData?.isOpen ? "success" : "destructive"} className="px-2 py-0 rounded text-[9px] font-black uppercase tracking-tighter shadow-none">
                {outletData?.isOpen ? "Buka" : "Tutup"}
              </Badge>
              <Badge variant="outline" className="px-2 py-0 rounded text-[9px] font-black uppercase tracking-tighter text-muted-foreground bg-muted/20 border-border/60 shadow-none">
                {outletData?.type}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics KPI Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Performa Real-time Outlet</h2>
            <p className="text-xs text-muted-foreground">Analitik pendapatan dan aktivitas pesanan outlet Anda.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="rounded-md gap-0 py-0 border-border/40 bg-muted/10 h-32" />
            ))}
          </div>
        ) : (
          <KpiCards kpis={kpiCards} />
        )}
      </div>

      {/* Privileges & Quick Links Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Privileges */}
        <Card className="lg:col-span-2 rounded-md border-border/60 shadow-sm bg-background">
          <CardHeader className="border-b border-border/40 p-5 bg-muted/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Hak Akses & Privilege Anda
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Berikut adalah menu dan fitur yang diizinkan untuk Anda operasikan:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {allowedPrivileges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allowedPrivileges.map((p) => (
                  <div key={p.key} className="p-4 rounded-xl border border-border/40 bg-muted/20 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200 group flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-background border border-border/50 text-primary group-hover:scale-110 transition-transform">
                      <p.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-medium">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground font-semibold">Anda belum memiliki hak akses operasional apa pun.</p>
                <p className="text-xs text-muted-foreground/75">Hubungi Owner untuk menetapkan privileges di akun manager Anda.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Info & Quick Links */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card className="rounded-md border-border/60 shadow-sm bg-background">
            <CardHeader className="border-b border-border/40 p-5 bg-muted/10">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Navigasi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {allowedPrivileges.map((p) => (
                <Button
                  key={p.key}
                  variant="outline"
                  asChild
                  className="w-full justify-between h-11 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all shadow-none"
                >
                  <Link href={p.href} className="flex items-center w-full justify-between">
                    <span className="flex items-center gap-2">
                      <p.icon className="h-3.5 w-3.5 shrink-0" />
                      {p.label}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ))}

              <Button
                variant="outline"
                asChild
                className="w-full justify-between h-11 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
              >
                <Link href="/auth/login/cashier" target="_blank" className="flex items-center w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Buka Aplikasi Kasir (POS)
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
