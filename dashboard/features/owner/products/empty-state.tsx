"use client";

import { Plus, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasOutlet: boolean;
  onAdd: () => void;
}

export default function ProductsEmptyState({ hasOutlet, onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-md border border-border/80 bg-background shadow-sm overflow-hidden">
      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center border border-border/40 mb-6 group transition-all hover:scale-110">
        <Boxes className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground/90 mb-2 uppercase tracking-widest">
        Katalog Produk Kosong
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 font-medium">
        Anda belum menambahkan produk, jasa, atau tiket. Mulai bangun katalog Anda sekarang untuk memulai operasional bisnis.
      </p>
      <Button
        onClick={() => hasOutlet && onAdd()}
        disabled={!hasOutlet}
        className="h-12 px-8 gap-3 font-bold uppercase tracking-widest text-xs shadow-md transition-all active:scale-95"
      >
        <Plus className="h-4 w-4" /> Tambah Produk Pertama
      </Button>
    </div>
  );
}
