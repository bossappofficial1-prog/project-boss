"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CircleDollarSign, Clock3, Hash, ReceiptText, RefreshCw, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { tableApi } from "@/lib/apis/table";
import { billApi, Bill } from "@/lib/apis/bill";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type TablesContentProps = {
  outletId: string;
  outletName: string;
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  AVAILABLE: "default",
  OCCUPIED: "secondary",
  RESERVED: "outline",
  BILLED: "secondary",
};

export function TablesContent({ outletId, outletName }: TablesContentProps) {
  const queryClient = useQueryClient();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [billToPay, setBillToPay] = useState<string | null>(null);

  const tablesQuery = useQuery({
    queryKey: ["cashier-tables", outletId],
    queryFn: () => tableApi.getTables(outletId),
    enabled: !!outletId,
  });

  const billsQuery = useQuery({
    queryKey: ["cashier-bills", outletId],
    queryFn: () => billApi.getBills(outletId),
    enabled: !!outletId,
  });

  const createBillMutation = useMutation({
    mutationFn: (tableId: string) => billApi.createBill({ outletId, tableId }),
    onSuccess: () => {
      toast.success("Bill berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["cashier-tables", outletId] });
      queryClient.invalidateQueries({ queryKey: ["cashier-bills", outletId] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Gagal membuat bill");
    },
  });

  const payBillMutation = useMutation({
    mutationFn: (billId: string) => billApi.payBill(billId),
    onSuccess: () => {
      toast.success("Bill berhasil dibayar");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-tables", outletId] });
      queryClient.invalidateQueries({ queryKey: ["cashier-bills", outletId] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Gagal memproses pembayaran");
    },
  });

  const tables = tablesQuery.data ?? [];
  const bills = billsQuery.data ?? [];

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );

  const selectedBill = useMemo(() => {
    if (!selectedTableId) return null;
    return bills.find((bill) => bill.tableId === selectedTableId && bill.status !== "PAID") ?? null;
  }, [bills, selectedTableId]);

  const activeOrders = selectedBill?.orders ?? [];

  if (tablesQuery.isLoading || billsQuery.isLoading) {
    return <LoadingState message="Memuat data meja..." />;
  }

  if (tablesQuery.isError) {
    return (
      <EmptyState
        title="Gagal memuat meja"
        description="Coba muat ulang halaman untuk mengambil data meja terbaru."
        icon={<Table2 className="w-8 h-8 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{outletName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meja & Bill</h1>
            <p className="text-sm text-muted-foreground">
              Pantau meja aktif, buat bill, lalu proses pembayaran dari satu layar.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["cashier-tables", outletId] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => {
            const isSelected = table.id === selectedTableId;
            const bill = bills.find((item) => item.tableId === table.id && item.status !== "PAID");

            return (
              <Card
                key={table.id}
                className={`cursor-pointer py-0 rounded-lg border bg-card shadow-md transition-colors ${isSelected ? "border-primary" : "hover:border-primary/40"}`}
                onClick={() => setSelectedTableId(table.id)}
              >
                <CardHeader className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-medium">{table.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                        <Hash className="h-3.5 w-3.5" />
                        Kapasitas {table.capacity} orang
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant[table.status] ?? "outline"} className="rounded-md">
                      {table.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pesanan aktif</span>
                    <span className="font-medium">{table._count?.orders ?? 0}</span>
                  </div>
                  {bill ? (
                    <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">Bill aktif</span>
                        <Badge variant="secondary" className="rounded-md">{bill.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" /> Total</span>
                        <span className="font-mono">Rp {bill.total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      Belum ada bill aktif untuk meja ini.
                    </div>
                  )}
                  <div className="flex gap-2">
                    {table.status === "OCCUPIED" && !bill && (
                      <Button
                        className="flex-1 rounded-md"
                        onClick={(event) => {
                          event.stopPropagation();
                          createBillMutation.mutate(table.id);
                        }}
                        disabled={createBillMutation.isPending}
                      >
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Generate Bill
                      </Button>
                    )}
                    {bill && bill.status !== "PAID" && (
                      <Button
                        className="flex-1 rounded-md"
                        variant="default"
                        onClick={(event) => {
                          event.stopPropagation();
                          setBillToPay(bill.id);
                        }}
                        disabled={payBillMutation.isPending}
                      >
                        <CircleDollarSign className="mr-2 h-4 w-4" />
                        Proses Pembayaran
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-lg py-0 gap-0 shadow-md">
          <CardHeader className="space-y-2 border-b p-4">
            <CardTitle className="text-lg font-medium">Detail Bill</CardTitle>
            <CardDescription>
              {selectedTable ? `Meja ${selectedTable.name}` : "Pilih meja untuk melihat detail bill."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {!selectedTable ? (
              <EmptyState
                title="Belum ada meja dipilih"
                description="Klik salah satu kartu meja untuk melihat ringkasan order dan total bill."
                icon={<Table2 className="w-8 h-8 text-muted-foreground" />}
              />
            ) : (
              <>
                <div className="grid gap-3 rounded-md border border-border/60 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Status meja</span>
                    <Badge variant={statusVariant[selectedTable.status] ?? "outline"} className="rounded-md">
                      {selectedTable.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Pesanan aktif</span>
                    <span className="font-medium">{selectedTable._count?.orders ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Total bill</span>
                    <span className="font-mono font-medium">
                      Rp {(selectedBill?.total ?? 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Order Aktif</h3>
                  {activeOrders.length === 0 ? (
                    <EmptyState
                      title="Belum ada order aktif"
                      description="Table ini belum memiliki order yang bisa dimasukkan ke bill."
                      icon={<ReceiptText className="w-8 h-8 text-muted-foreground" />}
                    />
                  ) : (
                    activeOrders.map((order) => (
                      <div key={order.id} className="rounded-md border border-border/60 p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{order.guestCustomer?.name ?? "Customer"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <span className="font-mono text-sm">
                            Rp {Number(order.totalAmount).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Status: {order.orderStatus}</span>
                          <span>•</span>
                          <span>Payment: {order.paymentStatus}</span>
                          <span>•</span>
                          <span>{order.items?.length ?? 0} item</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!billToPay}
        onOpenChange={(v) => !v && setBillToPay(null)}
        title="Konfirmasi Pembayaran"
        description="Apakah Anda yakin ingin memproses pembayaran bill ini? Tindakan ini akan menutup bill dan mengosongkan meja."
        confirmLabel="Ya, Bayar Sekarang"
        onConfirm={() => {
          if (billToPay) {
            payBillMutation.mutate(billToPay);
            setBillToPay(null);
          }
        }}
      />
    </div>
  );
}