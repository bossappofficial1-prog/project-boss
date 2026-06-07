"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchClick: () => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  onStatusChange: (s: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
};

export default function StockControls({ searchQuery, onSearchChange, onSearchClick, statusFilter, onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-1">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
            className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-base focus-visible:border-red-500 focus-visible:ring-red-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>
      <div>
        <Select value={statusFilter} onValueChange={(value: 'ALL' | 'ACTIVE' | 'INACTIVE') => onStatusChange(value)}>
          <SelectTrigger className="h-11 rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-base focus-visible:border-red-500 focus-visible:ring-red-500 dark:border-gray-700 dark:bg-gray-900">
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Button
          type="button"
          onClick={onSearchClick}
          className="flex w-full items-center justify-center rounded-lg bg-red-gradient px-4 py-3 text-white transition-all duration-300 hover:bg-red-gradient-dark hover:shadow-lg"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Cari</span>
          <span className="sm:hidden">Search</span>
        </Button>
      </div>
    </div>
  );
}
