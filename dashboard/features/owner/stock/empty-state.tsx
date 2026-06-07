"use client";
import React from 'react';
import { Package } from 'lucide-react';

export default function StockEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 rounded-md border border-border/80 bg-background shadow-sm overflow-hidden border-dashed">
      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center border border-border/40 mb-6 group transition-all hover:scale-110">
        <Package className="h-10 w-10 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
      <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest mb-2">
        Data Stok Kosong
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs font-medium opacity-80">
        Belum ada produk barang yang ditemukan atau inventaris Anda belum terisi data stok.
      </p>
    </div>
  );
}
