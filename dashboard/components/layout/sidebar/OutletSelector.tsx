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
            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2.5 text-sm font-medium text-sidebar-accent-foreground">
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                {!isCollapsed && <span>Memuat...</span>}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">Gagal memuat</span>}
                    </div>
                    <Button
                        onClick={onRefetch}
                        variant="ghost"
                        size="sm"
                        className="h-auto flex-shrink-0 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                            className="h-10 w-full rounded-lg bg-sidebar-accent px-2 text-sidebar-accent-foreground hover:bg-primary/10 hover:text-primary"
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
            <SelectTrigger className="w-full rounded-lg border-sidebar-border bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-sidebar-accent focus:ring-2 focus:ring-ring">
                <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover text-popover-foreground">
                {outlets.length === 0 ? (
                    <SelectItem value="outlet_not_found" disabled>
                        Belum ada outlet
                    </SelectItem>
                ) : (
                    outlets.map((outlet) => (
                        <SelectItem
                            key={outlet.id}
                            value={outlet.id}
                            className="cursor-pointer"
                        >
                            {outlet.name}
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    );
}
