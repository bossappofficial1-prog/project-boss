"use client";

import React from "react";
import { useManagerContext } from "@/app/manager/layout";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { StaffPrivilegeType } from "@/types/staff";

interface PrivilegeGuardProps {
  requiredPrivilege: StaffPrivilegeType;
  children: React.ReactNode;
}

export default function PrivilegeGuard({
  requiredPrivilege,
  children,
}: PrivilegeGuardProps) {
  const { managerData } = useManagerContext();
  const privileges = managerData?.privileges || [];
  
  const hasAccess = privileges.some((p: any) => {
    const privName = p.privilege || p;
    return privName === requiredPrivilege;
  });

  const privilegeFriendlyNames: Record<StaffPrivilegeType, string> = {
    OUTLET_MANAGEMENT: "Manajemen Outlet (Info, Meja & Reservasi)",
    PRODUCT_MANAGEMENT: "Manajemen Produk",
    STOCK_MANAGEMENT: "Manajemen Stok & Supplier",
    CUSTOMER_MANAGEMENT: "Manajemen Pelanggan",
    ORDER_MANAGEMENT: "Manajemen Pesanan",
    SERVICE_MANAGEMENT: "Manajemen Layanan Booking",
    FINANCE_REPORTS: "Laporan Keuangan & Pengeluaran",
    TRANSACTION_VIEW: "Lihat Riwayat Transaksi",
    TRANSACTION_DELETE: "Hapus Transaksi",
    ANALYTICS: "Analitik & Laporan Performa",
    TOOLS_CALCULATOR: "Alat Bantu & Kalkulator",
    INGREDIENT_MANAGEMENT: "Manajemen Bahan Baku",
    RECIPE_MANAGEMENT: "Manajemen Resep Menu",
    ATTENDANCE_MANAGEMENT: "Manajemen Absensi Staf",
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 animate-fade-in-up">
        <Card className="max-w-md w-full rounded-xl border border-destructive/20 bg-background/50 backdrop-blur-md shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-destructive via-red-500 to-orange-500" />
          <CardContent className="p-6 md:p-8 flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive shadow-inner">
              <ShieldAlert className="h-10 w-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">Akses Terbatas</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-destructive bg-destructive/10 px-2.5 py-1 rounded-full inline-block">
                Privilege: {requiredPrivilege}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium mt-2">
                Akun manager Anda tidak memiliki hak akses <strong>{privilegeFriendlyNames[requiredPrivilege]}</strong>.
              </p>
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
                Silakan hubungi Owner bisnis Anda untuk mengaktifkan opsi hak akses ini pada kelola staff.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
