"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Outlet } from "@/types";

interface TransactionFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  outletId: string;
  onOutletIdChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  outlets: Outlet[];
  isManagerView: boolean;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function TransactionFilterBar({
  searchTerm,
  onSearchChange,
  type,
  onTypeChange,
  outletId,
  onOutletIdChange,
  status,
  onStatusChange,
  outlets,
  isManagerView,
  onResetFilters,
  hasActiveFilters,
}: TransactionFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3">
      <div className="relative group flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Cari transaksi (ID, Deskripsi)..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 text-xs font-bold bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/10 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="h-10 w-[140px] text-[10px] font-bold bg-background/50 border-border/40">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Tipe</SelectItem>
            <SelectItem value="INCOME">Pemasukan</SelectItem>
            <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>

        {!isManagerView && (
          <Select
            value={outletId || "all"}
            onValueChange={(v) => onOutletIdChange(v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-10 w-[180px] text-[10px] font-bold bg-background/50 border-border/40">
              <SelectValue placeholder="Outlet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={status || "all"}
          onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10 w-[140px] text-[10px] font-bold bg-background/50 border-border/40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUCCESS">Berhasil</SelectItem>
            <SelectItem value="FAILED">Gagal</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onResetFilters}
            className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
