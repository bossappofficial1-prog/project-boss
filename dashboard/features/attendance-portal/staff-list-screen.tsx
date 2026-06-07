"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Settings,
  LogIn,
  LogOut,
  Fingerprint,
  Search,
  ChevronRight,
  Loader2,
  Camera,
} from "lucide-react";

import { staffApi } from "@/lib/apis/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { LiveClock } from "./live-clock";
import { StaffAvatar } from "./staff-avatar";
import type { StaffMember } from "@/types/staff";
import type { StaffListScreenProps } from "./types";

export function StaffListScreen({
  config,
  clockType,
  onSelectStaff,
  onChangeClockType,
  onOpenSetup,
}: StaffListScreenProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const handleLoad = useCallback(() => {
    setLoading(true);
    staffApi
      .listByOutlet(config.outletId)
      .then((d) => setStaffList(d.filter((s) => s.status === "ACTIVE")))
      .catch(() => toast.error("Gagal memuat daftar staf. Periksa koneksi."))
      .finally(() => setLoading(false));
  }, [config.outletId]);

  useEffect(() => {
    handleLoad();
  }, [handleLoad]);

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-border px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {config.outletName}
          </h1>
          <p className="text-xs text-muted-foreground">Portal Absensi Staf</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLoad}
            title="Refresh daftar staf"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSetup}
            title="Pengaturan kiosk"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
        {/* Clock */}
        <LiveClock />

        {/* Clock Type Selector */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onChangeClockType("in")}
            className={`${
              clockType === "in"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Absen Masuk
          </Button>
          <Button
            onClick={() => onChangeClockType("out")}
            className={` ${
              clockType === "out"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Absen Pulang
          </Button>
        </div>

        {/* Instruction */}
        <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-3 border border-border">
          <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
            <Fingerprint className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Pilih mode di atas, lalu{" "}
            <strong className="text-foreground">ketuk nama Anda</strong> dari
            daftar di bawah
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama staf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Memuat daftar staf...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-foreground">
              {search
                ? `Tidak ada staf dengan nama "${search}"`
                : "Belum ada staf aktif di outlet ini"}
            </p>
            <p className="text-xs text-muted-foreground">
              Hubungi owner untuk menambahkan staf
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((staff) => (
              <button
                key={staff.id}
                onClick={() => onSelectStaff(staff)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
              >
                <StaffAvatar staff={staff} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {staff.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {staff.role === "MANAGER"
                        ? "Manager"
                        : staff.role === "CASHIER"
                          ? "Kasir"
                          : staff.role === "WAITER"
                            ? "Waiter"
                            : staff.role === "KITCHEN"
                              ? "Kitchen"
                              : "Staf"}
                    </span>
                    {staff.faceDescriptor && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-4 border-primary/30 text-primary"
                      >
                        <Camera className="w-2.5 h-2.5 mr-1" />
                        Wajah terdaftar
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
