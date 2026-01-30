'use client'

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Outlet } from "@/types";
import { AlertCircle, RefreshCw, Store } from "lucide-react";

interface OutletSelectorProps {
    selectedOutlet: Outlet | null;
    outlets: Outlet[];
    isLoading: boolean;
    error: any;
    onOutletChange: (outletId: string) => void;
    onRefetch: () => void;
}

export function OutletSelector({
    selectedOutlet,
    outlets,
    isLoading,
    error,
    onOutletChange,
    onRefetch,
}: OutletSelectorProps) {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    if (isLoading) {
        return (
            <div className="w-full px-3 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm font-medium flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                {!isCollapsed && <span>Memuat...</span>}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full px-3 py-2.5 rounded-lg bg-red-500/20 backdrop-blur-sm text-red-100 text-sm font-medium">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">Gagal memuat</span>}
                    </div>
                    <Button
                        onClick={onRefetch}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-red-200 hover:text-white hover:bg-red-500/30 flex-shrink-0"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        );
    }

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-10 px-2 bg-white/10 hover:bg-white/15 text-white"
                        >
                            <Store className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{selectedOutlet?.name || 'Pilih Outlet'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Select value={selectedOutlet?.id || ''} onValueChange={onOutletChange}>
            <SelectTrigger className="w-full px-3 py-2.5 border-0 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-red-200 focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/15 text-sm font-medium transition-all">
                <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-red-950 border-gray-200 dark:border-red-800">
                {outlets.length === 0 ? (
                    <SelectItem value="outlet_not_found" disabled>
                        Belum ada outlet
                    </SelectItem>
                ) : (
                    outlets.map((outlet) => (
                        <SelectItem
                            key={outlet.id}
                            value={outlet.id}
                            className="text-gray-900 dark:text-red-50 cursor-pointer dark:focus:bg-red-900/50"
                        >
                            {outlet.name}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );
}