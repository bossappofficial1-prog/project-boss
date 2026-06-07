import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

export function BusinessHealthEmpty() {
  return (
    <Card className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-dashed bg-muted/20 shadow-none">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2 px-4">
        <h3 className="text-xl font-semibold">Data Tidak Ditemukan</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Maaf, kami tidak menemukan data kesehatan bisnis untuk periode dan
          outlet ini. Coba pilih rentang tanggal lain atau pastikan outlet telah
          memiliki transaksi.
        </p>
      </div>
    </Card>
  );
}
