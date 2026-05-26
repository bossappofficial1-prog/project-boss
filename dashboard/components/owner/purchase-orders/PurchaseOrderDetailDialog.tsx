import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  usePurchaseOrderDetail,
  useUpdatePOItems,
  useSendPO,
  useCompletePO,
} from "@/hooks/api/use-purchase-orders";
import {
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Send,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface PurchaseOrderDetailDialogProps {
  poId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderDetailDialog({
  poId,
  isOpen,
  onOpenChange,
}: PurchaseOrderDetailDialogProps) {
  const { data: po, isLoading } = usePurchaseOrderDetail(poId);
  const updateItemsMutation = useUpdatePOItems();
  const sendPOMutation = useSendPO();
  const completePOMutation = useCompletePO();

  // Local state for editing draft items
  const [editedItems, setEditedItems] = useState<
    Array<{
      id: string;
      productGoodsId?: string | null;
      ingredientId?: string | null;
      name: string;
      unit: string;
      quantity: number;
      priceAtOrder: number;
    }>
  >([]);
  const [editedNotes, setEditedNotes] = useState("");

  useEffect(() => {
    if (po && po.status === "DRAFT") {
      setEditedItems(
        po.items.map((item) => ({
          id: item.id,
          productGoodsId: item.productGoodsId,
          ingredientId: item.ingredientId,
          name:
            item.productGoods?.product.name ||
            item.ingredient?.name ||
            "Barang",
          unit:
            item.productGoods?.unit || item.ingredient?.purchaseUnit || "Unit",
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
        })),
      );
      setEditedNotes(po.notes || "");
    }
  }, [po]);

  if (!poId) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "SENT":
        return "bg-primary/10 text-primary border-primary/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draf Pesanan";
      case "SENT":
        return "Terkirim ke Supplier";
      case "COMPLETED":
        return "Selesai (Stok Masuk)";
      case "CANCELLED":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const handleUpdateQuantity = (index: number, val: number) => {
    setEditedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: Math.max(0.01, val) };
      return copy;
    });
  };

  const handleUpdatePrice = (index: number, val: number) => {
    setEditedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], priceAtOrder: Math.max(0, val) };
      return copy;
    });
  };

  const handleSaveChanges = async () => {
    try {
      const payload = {
        notes: editedNotes.trim() || undefined,
        items: editedItems.map((it) => ({
          productGoodsId: it.productGoodsId || undefined,
          ingredientId: it.ingredientId || undefined,
          quantity: it.quantity,
          priceAtOrder: it.priceAtOrder,
        })),
      };

      await updateItemsMutation.mutateAsync({ id: po!.id, payload });
      toast.success("Draf Purchase Order berhasil diperbarui");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memperbarui draf");
    }
  };

  const handleSendPO = async () => {
    try {
      await sendPOMutation.mutateAsync(po!.id);
      toast.success(
        "Purchase Order resmi berhasil dikirim ke Supplier via WA/Email!",
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengirim PO");
    }
  };

  const handleCompletePO = async () => {
    try {
      await completePOMutation.mutateAsync(po!.id);
      toast.success(
        "Restock Selesai! Stok barang otomatis ditambahkan ke batch FIFO/FEFO outlet.",
      );
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal mengonfirmasi penerimaan",
      );
    }
  };

  // Hitung total estimasi draf lokal
  const draftTotalEstimate = editedItems.reduce(
    (sum, item) => sum + item.quantity * item.priceAtOrder,
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 rounded-lg border border-border shadow-xl bg-card overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                  Detail Purchase Order
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Nomor PO:{" "}
                  <span className="font-mono text-foreground font-semibold">
                    {po?.poNumber || "Memuat..."}
                  </span>
                </DialogDescription>
              </div>
            </div>
            {po && (
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 font-semibold rounded-sm",
                  getStatusColor(po.status),
                )}
              >
                {getStatusLabel(po.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-4 bg-muted animate-pulse rounded-md w-1/3" />
            <div className="h-20 bg-muted animate-pulse rounded-md w-full" />
            <div className="h-40 bg-muted animate-pulse rounded-md w-full" />
          </div>
        ) : !po ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Gagal mengambil data pesanan pembelian.
          </div>
        ) : (
          <>
            <div className="space-y-5 px-6 pt-4 pb-4 overflow-y-auto flex-1">
              {/* Supplier and Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-md border border-border/50">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Supplier / Pemasok
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    {po.supplier.name}
                  </h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {po.supplier.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{po.supplier.phone}</span>
                      </div>
                    )}
                    {po.supplier.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{po.supplier.email}</span>
                      </div>
                    )}
                    {po.supplier.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{po.supplier.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 border-border">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Informasi PO
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Outlet Pengirim:
                      </span>
                      <span className="font-medium text-foreground">
                        {po.outlet.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tanggal Pembuatan:
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(po.createdAt).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                    {po.status === "COMPLETED" && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Tanggal Terima:</span>
                        <span className="font-medium">
                          {new Date(po.updatedAt).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {po.status !== "DRAFT" ? (
                po.notes && (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-md text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Catatan Pemasok:</span>{" "}
                    {po.notes}
                  </div>
                )
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Catatan Pembelian (Opsional)
                  </label>
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Tambahkan instruksi pengiriman, kontak supplier, atau catatan penyesuaian..."
                    className="h-9 text-xs rounded-md"
                  />
                </div>
              )}

              {/* Items List Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Daftar Barang Pesanan
                </span>
                <div className="border rounded-md overflow-hidden bg-background">
                  <ScrollArea className="max-h-70">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/80 text-muted-foreground font-semibold border-b">
                          <th className="p-3 w-10 text-center">No</th>
                          <th className="p-3">Nama Barang</th>
                          <th className="p-3 text-center w-28">Jumlah</th>
                          <th className="p-3 text-right w-36">Harga Satuan</th>
                          <th className="p-3 text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.status === "DRAFT"
                          ? editedItems.map((item, idx) => (
                              <tr
                                key={item.id}
                                className="border-b hover:bg-muted/30"
                              >
                                <td className="p-3 text-center text-muted-foreground">
                                  {idx + 1}
                                </td>
                                <td className="p-3 font-semibold text-foreground">
                                  {item.name}
                                </td>
                                <td className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="any"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleUpdateQuantity(
                                          idx,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-center p-1 text-xs w-16 rounded-md font-medium border-input"
                                    />
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {item.unit}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-muted-foreground font-semibold">
                                      Rp
                                    </span>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={item.priceAtOrder}
                                      onChange={(e) =>
                                        handleUpdatePrice(
                                          idx,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-right p-1 text-xs w-24 rounded-md font-medium border-input"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right font-bold text-foreground">
                                  Rp{" "}
                                  {(
                                    item.quantity * item.priceAtOrder
                                  ).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            ))
                          : po.items.map((item, idx) => {
                              const name =
                                item.productGoods?.product.name ||
                                item.ingredient?.name ||
                                "Barang";
                              const unit =
                                item.productGoods?.unit ||
                                item.ingredient?.purchaseUnit ||
                                "Unit";
                              return (
                                <tr
                                  key={item.id}
                                  className="border-b hover:bg-muted/30"
                                >
                                  <td className="p-3 text-center text-muted-foreground">
                                    {idx + 1}
                                  </td>
                                  <td className="p-3 font-semibold text-foreground">
                                    {name}
                                  </td>
                                  <td className="p-3 text-center font-semibold text-foreground">
                                    {item.quantity} {unit}
                                  </td>
                                  <td className="p-3 text-right text-muted-foreground font-semibold">
                                    Rp{" "}
                                    {item.priceAtOrder.toLocaleString("id-ID")}
                                  </td>
                                  <td className="p-3 text-right font-bold text-foreground">
                                    Rp{" "}
                                    {(
                                      item.quantity * item.priceAtOrder
                                    ).toLocaleString("id-ID")}
                                  </td>
                                </tr>
                              );
                            })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-md border border-primary/10">
                <span className="text-sm font-semibold text-foreground">
                  Estimasi Nilai Pemesanan:
                </span>
                <span className="text-xl font-black text-primary">
                  Rp{" "}
                  {(po.status === "DRAFT"
                    ? draftTotalEstimate
                    : po.totalEstimate
                  ).toLocaleString("id-ID")}
                </span>
              </div>

              {/* Alert warnings for SENT status */}
              {po.status === "SENT" && (
                <div className="flex gap-2 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-md text-xs text-emerald-800 dark:text-emerald-300">
                  <AlertTriangle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Informasi SCM:</span> Barang
                    pesanan sudah dikirim ke supplier. Begitu truk pengiriman
                    fisik tiba di gudang, silakan klik tombol hijau{" "}
                    <b>"Konfirmasi Barang Diterima"</b> di bawah untuk
                    menambahkannya langsung ke sistem stok batch Anda secara
                    otomatis!
                  </div>
                </div>
              )}

              {/* Dialog Footer Actions */}
            </div>
            <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 text-xs font-bold rounded-md"
              >
                Tutup
              </Button>

              <div className="flex items-center gap-2">
                {po.status === "DRAFT" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSaveChanges}
                      disabled={updateItemsMutation.isPending}
                      className="h-10 text-xs font-bold rounded-md"
                    >
                      {updateItemsMutation.isPending
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
                    </Button>
                    <Button
                      onClick={handleSendPO}
                      disabled={sendPOMutation.isPending}
                      className="h-10 text-xs font-bold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-md shadow-primary/20"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {sendPOMutation.isPending
                        ? "Mengirim..."
                        : "Setujui & Kirim ke Supplier"}
                    </Button>
                  </>
                )}

                {po.status === "SENT" && (
                  <Button
                    onClick={handleCompletePO}
                    disabled={completePOMutation.isPending}
                    className="h-10 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {completePOMutation.isPending
                      ? "Memproses..."
                      : "Konfirmasi Barang Diterima"}
                  </Button>
                )}

                {po.status === "COMPLETED" && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-sm">
                    <CheckCircle className="h-4 w-4" />
                    Barang & Stok Berhasil Diterima
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
