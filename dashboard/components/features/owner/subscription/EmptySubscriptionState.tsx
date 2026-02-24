import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, ShieldCheck } from "lucide-react";

interface Props {
    onRefresh: () => void;
}

export function EmptySubscriptionState({ onRefresh }: Props) {
    return (
        <Card className="border border-dashed border-slate-200 bg-slate-50">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <ShieldCheck className="h-10 w-10 text-slate-400" />
                <h3 className="text-lg font-semibold text-gray-800">Belum ada paket langganan aktif</h3>
                <p className="text-sm text-muted-foreground">
                    Kami tidak menemukan paket langganan untuk bisnis Anda. Hubungi tim dukungan untuk menyalakan akses dashboard.
                </p>
                <Button onClick={onRefresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Coba Muat Ulang
                </Button>
            </CardContent>
        </Card>
    );
}
