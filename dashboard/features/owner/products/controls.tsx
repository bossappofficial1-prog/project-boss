"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadCloud, Import, Plus } from "lucide-react";

interface ControlsProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  hasOutlet: boolean;
}

export default function ProductsControls({
  searchQuery,
  onSearchChange,
  onAdd,
  onImport,
  onExport,
  hasOutlet,
}: ControlsProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => hasOutlet && onAdd()} disabled={!hasOutlet}>
          <Plus />
          Tambah Produk/Jasa
        </Button>
        <Button onClick={() => hasOutlet && onImport()} disabled={!hasOutlet} variant="secondary">
          <Import />
          Import Data
        </Button>
        <Button onClick={onExport} variant="outline">
          <DownloadCloud />
          Export Data
        </Button>
      </div>
    </>
  );
}
