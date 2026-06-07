"use client";

import { useState, useMemo } from "react";
import { useOutletStore } from "@/stores/outlet.store";
import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/apis/stock";
import {
  useStockTransfers,
  useCreateStockTransfer,
  useUpdateStockTransferStatus,
} from "@/hooks/use-stock-transfer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import {
  ArrowRightLeft,
  Calendar,
  Plus,
  Trash2,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Eye,
  ArrowRight,
  PackageCheck,
  PackageMinus,
  Inbox,
  AlertTriangle,
  Check as CheckIcon,
  ChevronsUpDown,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DatePicker } from "@/components/ui/date-picker";

interface TransferItemInput {
  productId: string;
  quantity: number;
}

export default function StockTransferContent() {
  const { outlets, isLoading: outletLoading } = useOutletStore();
  const [activeTab, setActiveTab] = useState<string>("list");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [senderFilter, setSenderFilter] = useState("ALL");
  const [receiverFilter, setReceiverFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Detail Modal
  const [detailTransferId, setDetailTransferId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create Form State
  const [senderOutletId, setSenderOutletId] = useState<string>("");
  const [receiverOutletId, setReceiverOutletId] = useState<string>("");
  const [shippingDate, setShippingDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState<string>("");
  const [formItems, setFormItems] = useState<TransferItemInput[]>([
    { productId: "", quantity: 1 },
  ]);
  const [openComboIndex, setOpenComboIndex] = useState<number | null>(null);

  // Fetch Stock Transfers
  const { data: transfersResponse, isLoading: isLoadingTransfers } =
    useStockTransfers({
      page,
      limit,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      senderOutletId: senderFilter === "ALL" ? undefined : senderFilter,
      receiverOutletId: receiverFilter === "ALL" ? undefined : receiverFilter,
      search: search || undefined,
    });

  const transfers = transfersResponse?.data || [];
  const totalItems = transfersResponse?.pagination?.total || 0;

  // Fetch sender outlet products with their stock levels
  const { data: senderProductsResponse, isLoading: isLoadingProducts } =
    useQuery({
      queryKey: ["sender-products-stock", senderOutletId],
      queryFn: () =>
        stockApi.getByOutlet(senderOutletId, {
          limit: 100,
          type: "GOODS",
          status: "ACTIVE",
        }),
      enabled: !!senderOutletId,
    });

  const senderProducts = senderProductsResponse?.data || [];

  // Mutations
  const createTransfer = useCreateStockTransfer();
  const updateStatus = useUpdateStockTransferStatus();

  // Find detailed transfer data for modal
  const detailedTransfer = useMemo(() => {
    return transfers.find((t) => t.id === detailTransferId);
  }, [transfers, detailTransferId]);

  const handleOpenDetail = (id: string) => {
    setDetailTransferId(id);
    setIsDetailOpen(true);
  };

  // Form methods
  const handleAddRow = () => {
    setFormItems([...formItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = [...formItems];
    updated.splice(index, 1);
    setFormItems(updated);
  };

  const handleItemChange = (
    index: number,
    field: keyof TransferItemInput,
    value: any,
  ) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderOutletId) return toast.error("Outlet pengirim wajib dipilih.");
    if (!receiverOutletId) return toast.error("Outlet penerima wajib dipilih.");
    if (senderOutletId === receiverOutletId) {
      return toast.error("Outlet pengirim dan penerima tidak boleh sama.");
    }
    if (!shippingDate) return toast.error("Tanggal pengiriman wajib diisi.");

    // Validate items
    const validItems = formItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      return toast.error(
        "Pilih minimal satu produk dengan kuantitas yang valid.",
      );
    }

    // Check stock levels
    for (const item of validItems) {
      const prod = senderProducts.find((p) => p.id === item.productId);
      const stock = prod?.goods?.currentStock || 0;
      if (item.quantity > stock) {
        return toast.error(
          `Kuantitas transfer untuk ${prod?.name} (${item.quantity}) melebihi stok yang tersedia (${stock}).`,
        );
      }
    }

    toast.promise(
      createTransfer.mutateAsync({
        senderOutletId,
        receiverOutletId,
        shippingDate,
        note: note || undefined,
        items: validItems,
      }),
      {
        loading: "Membuat transfer stok baru...",
        success: () => {
          // Reset form
          setSenderOutletId("");
          setReceiverOutletId("");
          setShippingDate(new Date().toISOString().split("T")[0]);
          setNote("");
          setFormItems([{ productId: "", quantity: 1 }]);
          setActiveTab("list");
          return "Permintaan transfer stok berhasil dibuat.";
        },
        error: (err: any) =>
          err.response?.data?.message || "Gagal membuat transfer stok.",
      },
    );
  };

  const handleUpdateStatus = (
    id: string,
    status: "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED",
  ) => {
    let actionText = "";
    if (status === "IN_TRANSIT") actionText = "Mengirim transfer...";
    if (status === "RECEIVED") actionText = "Menerima transfer...";
    if (status === "CANCELLED") actionText = "Membatalkan transfer...";

    toast.promise(updateStatus.mutateAsync({ id, status }), {
      loading: actionText,
      success: "Status transfer berhasil diperbarui.",
      error: (err: any) =>
        err.response?.data?.message || "Gagal memperbarui status.",
    });
  };

  // DataTable column definitions
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "shippingDate",
      header: "Tanggal Pengiriman",
      cell: ({ row }) => {
        const date = new Date(row.original.shippingDate);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {date.toLocaleDateString("id-ID", { dateStyle: "medium" })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "outlets",
      header: "Rute Transfer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          <span className="text-foreground">
            {row.original.senderOutlet.name}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-primary">
            {row.original.receiverOutlet.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "itemsCount",
      header: "Jumlah Barang",
      cell: ({ row }) => (
        <span className="font-semibold text-muted-foreground">
          {row.original.items.length} jenis produk
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "PENDING") {
          return (
            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground border-border/80 gap-1.5 py-1"
            >
              <Clock className="h-3.5 w-3.5" />
              Menunggu Pengiriman
            </Badge>
          );
        }
        if (status === "IN_TRANSIT") {
          return (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1.5 py-1"
            >
              <Truck className="h-3.5 w-3.5 animate-bounce" />
              Dalam Perjalanan
            </Badge>
          );
        }
        if (status === "RECEIVED") {
          return (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Selesai Diterima
            </Badge>
          );
        }
        if (status === "CANCELLED") {
          return (
            <Badge
              variant="outline"
              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1.5 py-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Dibatalkan
            </Badge>
          );
        }
        return <Badge variant="outline">{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Aksi & Detail",
      cell: ({ row }) => {
        const transfer = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border"
              onClick={() => handleOpenDetail(transfer.id)}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Detail
            </Button>

            {transfer.status === "PENDING" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleUpdateStatus(transfer.id, "IN_TRANSIT")}
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  Kirim
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={() => handleUpdateStatus(transfer.id, "CANCELLED")}
                >
                  Batal
                </Button>
              </>
            )}

            {transfer.status === "IN_TRANSIT" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                  onClick={() => handleUpdateStatus(transfer.id, "RECEIVED")}
                >
                  <PackageCheck className="h-4 w-4" />
                  Terima Transfer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={() => handleUpdateStatus(transfer.id, "CANCELLED")}
                >
                  Batal
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (outletLoading) {
    return (
      <div className="space-y-6 py-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded-md mt-2" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="h-24 bg-muted animate-pulse rounded-md" />
          <div className="h-24 bg-muted animate-pulse rounded-md" />
          <div className="h-24 bg-muted animate-pulse rounded-md" />
          <div className="h-24 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transfer Outlet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola persediaan barang dan pengiriman stok antar outlet secara
            real-time.
          </p>
        </div>
        {activeTab === "list" && (
          <Button
            onClick={() => setActiveTab("create")}
            className="bg-primary text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Buat Transfer
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-muted p-1 rounded-md">
          <TabsTrigger value="list" className="rounded-sm py-1.5 px-3">
            Daftar Transfer
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-sm py-1.5 px-3">
            Buat Transfer Baru
          </TabsTrigger>
        </TabsList>

        {/* List of Transfers Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card className="rounded-lg py-0 border-border/80 bg-card">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-medium">
                Filter & Cari
              </CardTitle>
              <CardDescription>
                Saring daftar transfer berdasarkan rute dan status.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Cari Catatan/Outlet
                  </label>
                  <Input
                    placeholder="Ketik kata kunci..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-md border-input">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value="PENDING">
                        Menunggu Pengiriman
                      </SelectItem>
                      <SelectItem value="IN_TRANSIT">
                        Dalam Perjalanan
                      </SelectItem>
                      <SelectItem value="RECEIVED">Selesai Diterima</SelectItem>
                      <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Outlet Pengirim
                  </label>
                  <Select
                    value={senderFilter}
                    onValueChange={(val) => {
                      setSenderFilter(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-md border-input">
                      <SelectValue placeholder="Semua Outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Outlet</SelectItem>
                      {outlets.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Outlet Penerima
                  </label>
                  <Select
                    value={receiverFilter}
                    onValueChange={(val) => {
                      setReceiverFilter(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-md border-input">
                      <SelectValue placeholder="Semua Outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Outlet</SelectItem>
                      {outlets.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={columns}
            data={transfers}
            title="Riwayat Transfer Stok"
            emptyMessage="Belum ada transaksi transfer stok."
            tableId="stock-transfers-table"
            isLoading={isLoadingTransfers}
            serverSidePagination
            totalItems={totalItems}
            serverPage={page}
            serverLimit={limit}
            onPaginationChange={({ page, limit }) => {
              setPage(page);
              setLimit(limit);
            }}
          />
        </TabsContent>

        {/* Create Transfer Tab */}
        <TabsContent value="create">
          <Card className="rounded-lg py-0 gap-0 border-border/80 bg-card">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-medium">
                Buat Permintaan Transfer Baru
              </CardTitle>
              <CardDescription>
                Tentukan outlet pengirim, outlet penerima, serta masukkan produk
                yang akan ditransfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <form onSubmit={handleCreateTransfer} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-foreground">
                      Outlet Pengirim
                    </label>
                    <Select
                      value={senderOutletId}
                      onValueChange={(val) => {
                        setSenderOutletId(val);
                        // Reset items because product catalog changes
                        setFormItems([{ productId: "", quantity: 1 }]);
                      }}
                    >
                      <SelectTrigger className="rounded-md border-input">
                        <SelectValue placeholder="Pilih Outlet Asal" />
                      </SelectTrigger>
                      <SelectContent>
                        {outlets.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block text-foreground">
                      Outlet Penerima
                    </label>
                    <Select
                      value={receiverOutletId}
                      onValueChange={setReceiverOutletId}
                    >
                      <SelectTrigger className="rounded-md border-input">
                        <SelectValue placeholder="Pilih Outlet Tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {outlets
                          .filter((o) => o.id !== senderOutletId)
                          .map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block text-foreground">
                      Tanggal Pengiriman
                    </label>
                    <div className="relative">
                      <DatePicker
                        value={shippingDate}
                        onValueChange={(e) => setShippingDate(e as any)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block text-foreground">
                    Catatan (Opsional)
                  </label>
                  <Textarea
                    placeholder="Tambahkan catatan mengenai tujuan transfer ini jika diperlukan..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="rounded-md border-input"
                    rows={2}
                  />
                </div>

                <Separator className="bg-border/60" />

                {/* Items Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                      Pilih Produk & Jumlah
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRow}
                      disabled={!senderOutletId}
                      className="border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Tambah Produk
                    </Button>
                  </div>

                  {!senderOutletId ? (
                    <div className="rounded-md border border-dashed border-border/80 p-8 flex flex-col items-center justify-center text-center bg-muted/5">
                      <Inbox className="h-8 w-8 text-muted-foreground/60 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Silakan pilih Outlet Pengirim terlebih dahulu untuk
                        menampilkan katalog produk.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formItems.map((item, index) => {
                        const selectedProduct = senderProducts.find(
                          (p) => p.id === item.productId,
                        );
                        const availableStock =
                          selectedProduct?.goods?.currentStock || 0;
                        const unit = selectedProduct?.goods?.unit || "unit";

                        return (
                          <div
                            key={index}
                            className="flex items-end gap-3 p-3 rounded-lg border border-border/60 bg-muted/5 animate-fadeIn"
                          >
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                Nama Produk
                              </label>
                              <Popover
                                open={openComboIndex === index}
                                onOpenChange={(open) =>
                                  setOpenComboIndex(open ? index : null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openComboIndex === index}
                                    className="w-full h-9 justify-between rounded-md border-input font-normal bg-background hover:bg-background/80"
                                  >
                                    <span className="truncate">
                                      {item.productId
                                        ? senderProducts.find(
                                            (p) => p.id === item.productId,
                                          )?.name +
                                          ` (Stok: ${
                                            senderProducts.find(
                                              (p) => p.id === item.productId,
                                            )?.goods?.currentStock || 0
                                          } ${
                                            senderProducts.find(
                                              (p) => p.id === item.productId,
                                            )?.goods?.unit || "unit"
                                          })`
                                        : "Pilih Produk..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-(--radix-popover-trigger-width) p-0"
                                  align="start"
                                >
                                  <Command className="w-full">
                                    <CommandInput
                                      placeholder="Cari nama produk..."
                                      className="h-9"
                                    />
                                    <CommandList className="max-h-56 overflow-y-auto">
                                      <CommandEmpty>
                                        Produk tidak ditemukan.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {senderProducts.map((p) => (
                                          <CommandItem
                                            key={p.id}
                                            value={p.name}
                                            onSelect={() => {
                                              handleItemChange(
                                                index,
                                                "productId",
                                                p.id,
                                              );
                                              setOpenComboIndex(null);
                                            }}
                                            className="text-sm font-medium hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                                          >
                                            <div className="flex items-center gap-2 truncate">
                                              <CheckIcon
                                                className={cn(
                                                  "h-4 w-4 text-primary",
                                                  item.productId === p.id
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                                )}
                                              />
                                              <span className="truncate">
                                                {p.name}
                                              </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-2 font-mono shrink-0">
                                              Stok: {p.goods?.currentStock || 0}{" "}
                                              {p.goods?.unit}
                                            </span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="w-32">
                              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                Kuantitas
                              </label>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={1}
                                  max={availableStock}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="h-9 rounded-md border-input"
                                />
                                <span className="text-xs text-muted-foreground truncate w-12 font-medium">
                                  {unit}
                                </span>
                              </div>
                            </div>

                            {formItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRow(index)}
                                className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("list")}
                    className="border-border rounded-md"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !senderOutletId ||
                      !receiverOutletId ||
                      createTransfer.isPending
                    }
                    className="bg-primary text-primary-foreground rounded-md px-6"
                  >
                    {createTransfer.isPending
                      ? "Memproses..."
                      : "Kirim Transfer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transfer Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="md:max-w-2xl p-6 rounded-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detail Transfer Stok
            </DialogTitle>
            <DialogDescription className="text-xs">
              ID Transfer:{" "}
              <span className="font-mono text-foreground/80">
                {detailTransferId}
              </span>
            </DialogDescription>
          </DialogHeader>

          {detailedTransfer ? (
            <div className="space-y-6 mt-4">
              {/* Routing Summary */}
              <div className="rounded-md border border-border/80 bg-muted/5 p-4">
                <div className="flex items-center justify-between text-center">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Outlet Pengirim
                    </p>
                    <p className="text-base font-bold text-foreground mt-1">
                      {detailedTransfer.senderOutlet.name}
                    </p>
                  </div>
                  <div className="px-4 flex flex-col items-center">
                    {detailedTransfer.status === "PENDING" && (
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    )}
                    {detailedTransfer.status === "IN_TRANSIT" && (
                      <Truck className="h-6 w-6 text-amber-500 animate-pulse" />
                    )}
                    {detailedTransfer.status === "RECEIVED" && (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    )}
                    {detailedTransfer.status === "CANCELLED" && (
                      <XCircle className="h-6 w-6 text-rose-500" />
                    )}
                    <span className="text-[9px] font-semibold text-muted-foreground mt-1 block">
                      {detailedTransfer.status === "IN_TRANSIT"
                        ? "DALAM PERJALANAN"
                        : detailedTransfer.status}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Outlet Penerima
                    </p>
                    <p className="text-base font-bold text-primary mt-1">
                      {detailedTransfer.receiverOutlet.name}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-muted-foreground block">
                      Tanggal Pengiriman:
                    </span>
                    <span className="text-foreground/90 font-medium">
                      {new Date(
                        detailedTransfer.shippingDate,
                      ).toLocaleDateString("id-ID", {
                        dateStyle: "long",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block">
                      Dibuat Pada:
                    </span>
                    <span className="text-foreground/90 font-medium">
                      {new Date(detailedTransfer.createdAt).toLocaleString(
                        "id-ID",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </span>
                  </div>
                </div>

                {detailedTransfer.note && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs">
                    <span className="font-semibold text-muted-foreground block">
                      Catatan:
                    </span>
                    <p className="text-foreground/90 italic mt-0.5">
                      {detailedTransfer.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Shipped Items */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">
                  Daftar Produk yang Dikirim
                </h4>
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border text-xs text-muted-foreground font-semibold text-left">
                        <th className="py-2.5 px-4">Nama Produk</th>
                        <th className="py-2.5 px-4 text-center">
                          Barcode / SKU
                        </th>
                        <th className="py-2.5 px-4 text-right">Jumlah Kirim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {detailedTransfer.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/5">
                          <td className="py-2.5 px-4 font-medium">
                            {item.product.name}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-xs text-muted-foreground">
                            {item.product.goods?.barcode ||
                              item.product.goods?.sku ||
                              "-"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-foreground">
                            {item.quantity} {item.product.goods?.unit || "unit"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warnings and Actions inside Dialog */}
              {detailedTransfer.status === "IN_TRANSIT" && (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <AlertTriangle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Konfirmasi Penerimaan:</span>
                    <p className="mt-0.5 opacity-90">
                      Tekan tombol <strong>Terima Transfer</strong> setelah
                      barang tiba di outlet tujuan. Stok produk akan otomatis
                      bertambah di outlet penerima berdasarkan HPP pengiriman
                      FIFO.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Tutup
                </Button>

                {detailedTransfer.status === "PENDING" && (
                  <>
                    <Button
                      variant="default"
                      className="bg-primary text-primary-foreground"
                      onClick={() => {
                        handleUpdateStatus(detailedTransfer.id, "IN_TRANSIT");
                        setIsDetailOpen(false);
                      }}
                    >
                      <Truck className="h-4 w-4 mr-1.5" />
                      Kirim Transfer
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleUpdateStatus(detailedTransfer.id, "CANCELLED");
                        setIsDetailOpen(false);
                      }}
                    >
                      Batalkan
                    </Button>
                  </>
                )}

                {detailedTransfer.status === "IN_TRANSIT" && (
                  <>
                    <Button
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      onClick={() => {
                        handleUpdateStatus(detailedTransfer.id, "RECEIVED");
                        setIsDetailOpen(false);
                      }}
                    >
                      <PackageCheck className="h-4 w-4" />
                      Terima Transfer
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleUpdateStatus(detailedTransfer.id, "CANCELLED");
                        setIsDetailOpen(false);
                      }}
                    >
                      Batalkan
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
