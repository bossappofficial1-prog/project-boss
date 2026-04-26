"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutGrid, CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Table {
    id: string;
    name: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    capacity?: number;
}

interface TableSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tables: Table[];
    selectedTableId?: string;
    onSelect: (table: Table) => void;
    isLoading?: boolean;
}

export function TableSelector({
    open,
    onOpenChange,
    tables,
    selectedTableId,
    onSelect,
    isLoading
}: TableSelectorProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden border-border/80">
                <DialogHeader className="p-6 bg-muted/30 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest">Pilih Meja</DialogTitle>
                            <DialogDescription className="text-[10px] font-medium">
                                Pilih meja yang tersedia untuk pesanan ini.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex h-60 items-center justify-center">
                            <span className="text-sm text-muted-foreground animate-pulse font-bold uppercase tracking-widest">Memuat Meja...</span>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="flex h-60 flex-col items-center justify-center gap-2 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                            <LayoutGrid className="h-10 w-10 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Belum ada data meja</p>
                            <p className="text-[10px] font-medium opacity-60">Tambahkan meja di pengaturan outlet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {tables.map((table) => {
                                const isSelected = selectedTableId === table.id;
                                const isOccupied = table.status === 'OCCUPIED';
                                
                                return (
                                    <button
                                        key={table.id}
                                        onClick={() => {
                                            onSelect(table);
                                            onOpenChange(false);
                                        }}
                                        className={cn(
                                            "group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95",
                                            isSelected 
                                                ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                                                : isOccupied
                                                    ? "border-amber-500/30 bg-amber-500/[0.03] opacity-80"
                                                    : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                                            isSelected ? "bg-primary text-primary-foreground" : isOccupied ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                        )}>
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        
                                        <div className="text-center">
                                            <p className={cn(
                                                "text-[11px] font-black uppercase tracking-tight",
                                                isSelected ? "text-primary" : "text-foreground"
                                            )}>
                                                {table.name}
                                            </p>
                                            {table.capacity && (
                                                <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-muted-foreground mt-0.5">
                                                    <User className="h-2.5 w-2.5" />
                                                    <span>{table.capacity}</span>
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5 text-primary-foreground shadow-sm">
                                                <CheckCircle2 className="h-3 w-3" />
                                            </div>
                                        )}

                                        <Badge 
                                            variant={table.status === 'AVAILABLE' ? 'success' : 'warning'} 
                                            className="absolute -bottom-2 px-1.5 py-0 text-[8px] font-black uppercase tracking-tighter"
                                        >
                                            {table.status === 'AVAILABLE' ? 'Ready' : 'In Use'}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tersedia</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Terisi</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
