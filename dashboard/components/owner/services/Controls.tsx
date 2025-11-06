"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface ControlsProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchClick: () => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  onStatusChange: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
}

export default function ServicesControls({ searchQuery, onSearchChange, onSearchClick, statusFilter, onStatusChange }: ControlsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari jasa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
            className="w-full pl-10 pr-4"
          />
        </div>
      </div>
      <div>
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange(v as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
