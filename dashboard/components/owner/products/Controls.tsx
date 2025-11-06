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
        <Button onClick={() => hasOutlet && onAdd()} disabled={!hasOutlet} className={`${hasOutlet ? 'text-white hover:shadow-lg' : 'cursor-not-allowed'}`}>
          <Plus />
          Tambah Produk
        </Button>
        <Button onClick={() => hasOutlet && onImport()} disabled={!hasOutlet} className={` ${hasOutlet ? 'bg-green-500 cursor-pointer hover:bg-green-600 text-white hover:shadow-md' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
          <Import />
          Import Data
        </Button>
        <Button onClick={onExport} className="bg-orange-500 hover:bg-orange-600 cursor-pointer">
          <DownloadCloud />
          Export Data
        </Button>
      </div>
    </>
  );
}
