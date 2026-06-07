import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, ShieldCheck } from "lucide-react";

interface Props {
    onRefresh: () => void;
}

export function EmptySubscriptionState({ onRefresh }: Props) {
    return (
        <Card className="border border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Belum ada paket aktif</h3>
                <p className="text-sm font-medium text-muted-foreground">
                    Kami tidak menemukan paket langganan untuk bisnis Anda. Hubungi tim dukungan untuk menyalakan akses dashboard.
                </p>
                <Button onClick={onRefresh} variant="outline" className="h-10 px-6 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none">
                    <RefreshCw className="mr-2 h-4 w-4" /> Coba Muat Ulang
                </Button>
            </CardContent>
        </Card>
    );
}
