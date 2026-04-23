"use client";

import { Building2 } from "lucide-react";

export function EmptyDashboardState() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-20 text-center animate-in zoom-in-95 duration-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-inner">
                <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-bold text-foreground">Belum ada outlet aktif</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Kami tidak menemukan data untuk periode ini. Silakan tambahkan outlet baru atau coba ganti periode filter di atas.
                </p>
            </div>
        </div>
    );
}
