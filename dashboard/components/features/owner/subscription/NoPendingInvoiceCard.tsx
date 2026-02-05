import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";

interface Props {
    onRenew: () => void;
    disabled?: boolean;
    loading?: boolean;
}

export function NoPendingInvoiceCard({ onRenew, disabled, loading }: Props) {
    return (
        <Card>
            <CardContent className="flex flex-col gap-3 p-6 text-sm text-foreground md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-lg font-semibold text-card-foreground">Tidak ada tagihan tertunda</p>
                    <p>Paket langganan Anda aktif sepenuhnya. Buat perpanjangan kapan pun dibutuhkan.</p>
                </div>
                <Button variant="secondary" className="w-full md:w-auto" onClick={onRenew} disabled={disabled}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Buat Invoice Perpanjangan
                </Button>
            </CardContent>
        </Card>
    );
}
