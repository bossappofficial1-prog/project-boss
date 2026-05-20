"use client";

import { useState, useMemo } from "react";
import { ProductItem, useProductsData } from "@/hooks/useProductsData";
import { toast } from "sonner";
import { resolveUploadImageUrl } from "@/lib/url";
import { cn, formatCurrency } from "@/lib/utils";
import { useOutletContext } from "@/components/providers/OutletProvider";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ImportDataModal from "@/components/modals/ImportDataModal";
import AddOrEditProductServiceModal from "@/components/modals/AddProductServiceModal";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import TicketDetailDialog from "./TicketDetailDialog";

import {
  Package,
  Wrench,
  AlertCircle,
  Plus,
  Upload,
  Download,
  PenBox,
  Trash2,
  Boxes,
  Clock,
  Ticket,
  Eye,
} from "lucide-react";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryManager } from "./CategoryManager";

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80 bg-background -mx-6 px-6 pt-2">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-full opacity-50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-32 rounded-md" />
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-background shadow-none">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-md border border-border/80 bg-background shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/40 bg-muted/30">
          <Skeleton className="h-6 w-40 rounded-md" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md opacity-40" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface OverviewCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  variant?: "default" | "warning" | "danger" | "success";
}

function OverviewCard({
  icon,
  label,
  value,
  description,
  variant = "default",
}: OverviewCardProps) {
  const styles = {
    default: "bg-muted text-muted-foreground border-border",
    warning:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    success:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  return (
    <Card className="rounded-md gap-0 py-0 border-border/80 bg-background shadow-sm transition-all hover:shadow-md">
      <CardContent className="flex flex-col items-start gap-3 p-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md border shadow-sm ${styles[variant]}`}
        >
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tighter text-foreground/90 tabular-nums">
            {value}
          </p>
          {description && (
            <p className="text-[10px] font-semibold text-muted-foreground italic opacity-70">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsContent() {
  const [showAddOrEditModal, setShowAddOrEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [action, setAction] = useState<"add" | "edit">("add");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { allowedProductTypes, selectedOutlet: outletObj, isPlanMismatch } = useOutletContext();
  const router = useRouter();

  const addButtonText = useMemo(() => {
    if (!outletObj) return "Tambah Produk";

    const type = (outletObj.type === "CUSTOM" && isPlanMismatch)
      ? "FNB"
      : outletObj.type;

    switch (type) {
      case "EVENT":
        return "Tambah Tiket";
      case "SERVICE":
        return "Tambah Jasa";
      default:
        return "Tambah Produk";
    }
  }, [outletObj, isPlanMismatch]);

  const {
    products,
    outlets,
    selectedOutlet,
    currentPage,
    itemsPerPage,
    totalProducts,
    searchQuery,
    isLoading,
    error,
    hasBusinessProfile,
    hasOutlet,
    setCurrentPage,
    setItemsPerPage,
    setError,
    handleSearch,
    handleDeleteProduct,
    handleToggleStatus,
    handleExportProducts,
    handleRefreshData,
    formatDuration,
  } = useProductsData();

  const currentOutletName = outlets.find((o) => o.id === selectedOutlet)?.name;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => allowedProductTypes.includes(p.type));
  }, [products, allowedProductTypes]);

  const overview = useMemo(() => {
    const goods = filteredProducts.filter((p) => p.type === "GOODS");
    const services = filteredProducts.filter((p) => p.type === "SERVICE");
    const tickets = filteredProducts.filter((p) => p.type === "TICKET");
    const active = filteredProducts.filter((p) => p.status === "ACTIVE");
    const lowStock = goods.filter((p) => {
      if (!p.goods) return false;
      if (p.goods.currentStock === 0) return true;
      if (p.goods.minStock && p.goods.currentStock <= p.goods.minStock)
        return true;
      return false;
    });
    return {
      goods: goods.length,
      services: services.length,
      tickets: tickets.length,
      active: active.length,
      lowStock: lowStock.length,
    };
  }, [filteredProducts]);

  const cards = useMemo(() => {
    const list = [];

    // If multiple types are allowed, show the global "Total Produk" card first
    if (allowedProductTypes.length > 1) {
      list.push({
        id: "total",
        icon: <Boxes className="h-5 w-5" />,
        label: "Total Produk",
        value: filteredProducts.length,
        description: `${overview.active} produk aktif`,
        variant: "default" as const,
      });
    }

    if (allowedProductTypes.includes("GOODS")) {
      list.push({
        id: "goods",
        icon: <Package className="h-5 w-5" />,
        label: allowedProductTypes.length === 1 ? "Total Barang" : "Barang",
        value: overview.goods,
        description: allowedProductTypes.length === 1 ? `${overview.active} aktif` : undefined,
        variant: "default" as const,
      });
    }

    if (allowedProductTypes.includes("SERVICE")) {
      list.push({
        id: "services",
        icon: <Wrench className="h-5 w-5" />,
        label: allowedProductTypes.length === 1 ? "Total Jasa" : "Jasa / Layanan",
        value: overview.services,
        description: allowedProductTypes.length === 1 ? `${overview.active} aktif` : undefined,
        variant: "success" as const,
      });
    }

    if (allowedProductTypes.includes("TICKET")) {
      list.push({
        id: "tickets",
        icon: <Ticket className="h-5 w-5" />,
        label: allowedProductTypes.length === 1 ? "Total Tiket Event" : "Tiket Event",
        value: overview.tickets,
        description: allowedProductTypes.length === 1 ? `${overview.active} aktif` : undefined,
        variant: "default" as const,
      });
    }

    if (allowedProductTypes.includes("GOODS")) {
      list.push({
        id: "lowStock",
        icon: <AlertCircle className="h-5 w-5" />,
        label: "Stok Rendah",
        value: overview.lowStock,
        variant: overview.lowStock > 0 ? ("danger" as const) : ("default" as const),
        description: overview.lowStock > 0 ? "Perlu tindakan" : "Semua aman",
      });
    }

    return list;
  }, [allowedProductTypes, filteredProducts.length, overview]);

  const handleDelete = async (productId: string) => {
    try {
      setActionLoading(true);
      await handleDeleteProduct(productId);
      setShowDeleteModal(false);
      toast.success("Berhasil menghapus produk");
    } catch (err) {
      toast.error((err as any).message || "Gagal menghapus produk");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await handleExportProducts();
      toast.success("Berhasil mengexport data produk");
    } catch {
      toast.error("Gagal mengexport data produk");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && products.length === 0) return <PageSkeleton />;

  if (!isLoading && !hasBusinessProfile && !hasOutlet) {
    return (
      <EmptyOutletState
        onAddOutlet={() => router.push(`/owner#add-outlet`)}
      />
    );
  }

  const pageSizeOptions = (() => {
    const base = [5, 10, 20, 50, 100];
    const norm =
      Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 10;
    if (!base.includes(norm)) base.push(norm);
    return base.sort((a, b) => a - b);
  })();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div data-guide="products-header">
        <SectionHeader
          title="Produk & Jasa"
          description={`Kelola inventaris barang, layanan jasa, dan tiket event untuk ${currentOutletName}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setAction("add");
                  setShowAddOrEditModal(true);
                }}
                disabled={!hasOutlet}
                className="h-9 px-4 gap-2 font-bold text-xs uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" /> {addButtonText}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImportModal(true)}
                disabled={!hasOutlet}
                className="h-9 px-4 font-bold text-xs uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none"
              >
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || products.length === 0}
                className="h-9 px-4 font-bold text-xs uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none"
              >
                <Download className="mr-2 h-4 w-4" />{" "}
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          }
        />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-md border border-rose-200 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-400 shadow-sm animate-shake">
            <div className="p-1.5 rounded-md bg-background border border-rose-200">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-tight">
                Gagal Memuat Data
              </p>
              <p className="text-[10px] font-medium opacity-80">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-8 w-8 p-0 hover:bg-rose-500/10"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Overview Cards */}
        <div data-guide="products-overview" className={cn("grid gap-4",
          cards.length === 1 ? "grid-cols-1" : "grid-cols-2",
          cards.length === 1 ? "sm:grid-cols-1" :
            cards.length === 2 ? "sm:grid-cols-2" :
              cards.length === 3 ? "sm:grid-cols-3" :
                cards.length === 4 ? "sm:grid-cols-4" :
                  "sm:grid-cols-5"
        )}>
          {cards.map((card) => (
            <OverviewCard
              key={card.id}
              icon={card.icon}
              label={card.label}
              value={card.value}
              description={card.description}
              variant={card.variant}
            />
          ))}
        </div>

        {/* Data Table */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
          data-guide="products-tabs"
        >
          <TabsList className="bg-muted/50 border border-border/40 p-1 rounded-md h-auto gap-1">
            <TabsTrigger value="all">Semua</TabsTrigger>
            {allowedProductTypes.includes("GOODS") && (
              <TabsTrigger value="goods">Barang</TabsTrigger>
            )}
            {allowedProductTypes.includes("SERVICE") && (
              <TabsTrigger value="service">Jasa</TabsTrigger>
            )}
            {allowedProductTypes.includes("TICKET") && (
              <TabsTrigger value="ticket">Tiket</TabsTrigger>
            )}
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>

          {["all", "goods", "service", "ticket"]
            .filter(
              (tab) =>
                tab === "all" ||
                (tab === "goods" && allowedProductTypes.includes("GOODS")) ||
                (tab === "service" &&
                  allowedProductTypes.includes("SERVICE")) ||
                (tab === "ticket" && allowedProductTypes.includes("TICKET")),
            )
            .map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-3">
                <DataTable
                  data={
                    tab === "all"
                      ? filteredProducts
                      : tab === "goods"
                        ? filteredProducts.filter((p) => p.type === "GOODS")
                        : tab === "service"
                          ? filteredProducts.filter((p) => p.type === "SERVICE")
                          : filteredProducts.filter((p) => p.type === "TICKET")
                  }
                  onRefresh={handleRefreshData}
                  isRefreshing={isLoading}
                  showColumnVisibility
                  serverSidePagination
                  totalItems={tab === "all" ? totalProducts : undefined}
                  serverPage={tab === "all" ? currentPage : undefined}
                  serverLimit={tab === "all" ? itemsPerPage : undefined}
                  onPaginationChange={
                    tab === "all"
                      ? ({ page, limit }) => {
                        setItemsPerPage(limit);
                        setCurrentPage(page);
                      }
                      : undefined
                  }
                  pageSizeOptions={pageSizeOptions}
                  serverSideSearch={tab === "all"}
                  onSearchChange={tab === "all" ? handleSearch : undefined}
                  searchValue={tab === "all" ? searchQuery : undefined}
                  searchPlaceholder="Cari produk..."
                  searchDebounceMs={300}
                  columns={[
                    {
                      accessorKey: "name",
                      header: "Produk",
                      cell(props) {
                        const p = props.row.original as ProductItem;
                        return (
                          <div className="flex items-center gap-3 w-[220px]">
                            <div className="h-10 w-10 shrink-0 rounded-md border border-border/60 bg-muted/20 overflow-hidden shadow-sm">
                              <img
                                src={resolveUploadImageUrl(p.image)}
                                alt={p.name}
                                className="h-full w-full object-cover transition-transform hover:scale-110"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "/defaults/default-product-image.png";
                                }}
                              />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-sm font-bold tracking-tight text-foreground/90 truncate">
                                {p.name}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "px-1.5 py-0 rounded-md border text-[8px] font-bold uppercase tracking-tighter shadow-none bg-current/5",
                                  p.type === "GOODS"
                                    ? "text-blue-600 dark:text-blue-400 border-blue-500/20"
                                    : p.type === "SERVICE"
                                      ? "text-purple-600 dark:text-purple-400 border-purple-500/20"
                                      : "text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                                )}
                              >
                                {p.type === "GOODS"
                                  ? "Barang"
                                  : p.type === "SERVICE"
                                    ? "Jasa"
                                    : "Tiket"}
                              </Badge>
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      accessorKey: "price",
                      header: "Harga & Biaya",
                      cell(props) {
                        const p = props.row.original as ProductItem;
                        const price =
                          p.type === "GOODS"
                            ? p.goods?.sellingPrice
                            : p.type === "TICKET"
                              ? p.ticket?.sellingPrice
                              : p.service?.sellingPrice;
                        return (
                          <div className="space-y-1">
                            <p className="text-sm font-bold tabular-nums text-foreground/90 tracking-tight">
                              {formatCurrency(price ?? 0)}
                            </p>
                            {p.type === "GOODS" && (
                              <div className="flex items-center gap-1.5">
                                <div className="px-1 py-0 rounded bg-muted/50 border border-border/40 text-[9px] font-bold text-muted-foreground">
                                  HPP
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                  {formatCurrency(p.goods?.averageHpp ?? 0)}
                                </p>
                              </div>
                            )}
                            {p.type === "SERVICE" && p.service && (
                              <div className="flex items-center gap-1.5">
                                <div className="px-1 py-0 rounded bg-muted/50 border border-border/40 text-[9px] font-bold text-muted-foreground">
                                  Komisi
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                  {p.service.commissionType === "PERCENTAGE"
                                    ? `${p.service.commissionValue}%`
                                    : formatCurrency(p.service.commissionValue)}
                                </p>
                              </div>
                            )}
                            {p.type === "TICKET" && p.ticket && (
                              <p className="text-[10px] font-medium text-muted-foreground italic">
                                Kuota:{" "}
                                {p.ticket.totalQuota - p.ticket.soldCount}{" "}
                                tersisa
                              </p>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      accessorKey: "taxPercentage",
                      header: "Pajak",
                      enableSorting: false,
                      cell(props) {
                        const p = props.row.original as ProductItem;
                        return p.taxPercentage ? (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-500/30 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30"
                          >
                            {p.taxPercentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        );
                      },
                    },
                    {
                      accessorKey: "detail",
                      header: "Stok / Durasi",
                      enableSorting: false,
                      cell(props) {
                        const p = props.row.original as ProductItem;
                        if (p.type === "GOODS") {
                          const isLow =
                            p.goods &&
                            (p.goods.currentStock === 0 ||
                              (p.goods.minStock != null &&
                                p.goods.currentStock <= p.goods.minStock));
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    isLow
                                      ? "bg-rose-500 animate-pulse"
                                      : "bg-emerald-500",
                                  )}
                                />
                                <p
                                  className={cn(
                                    "text-sm font-bold tabular-nums tracking-tight",
                                    isLow ? "text-rose-600" : "text-foreground",
                                  )}
                                >
                                  {p.goods?.currentStock ?? 0} {p.goods?.unit}
                                </p>
                              </div>
                              {p.goods?.minStock != null && (
                                <p className="text-[10px] font-bold text-muted-foreground opacity-60">
                                  Min Stock: {p.goods.minStock}
                                </p>
                              )}
                            </div>
                          );
                        }
                        if (p.type === "TICKET" && p.ticket) {
                          const available =
                            p.ticket.totalQuota - p.ticket.soldCount;
                          const isSoldOut = available <= 0;
                          return (
                            <div className="space-y-1">
                              <p
                                className={cn(
                                  "text-sm font-bold tabular-nums tracking-tight",
                                  isSoldOut
                                    ? "text-rose-600"
                                    : "text-foreground",
                                )}
                              >
                                {isSoldOut
                                  ? "HABIS"
                                  : `${available} / ${p.ticket.totalQuota} TIKET`}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground opacity-60">
                                <Clock className="h-3 w-3" />
                                {new Date(
                                  p.ticket.eventDate,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border/40 w-fit">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-bold tabular-nums text-foreground">
                              {formatDuration(p.service?.durationMinutes)}
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      accessorKey: "status",
                      header: "Status",
                      enableSorting: false,
                      cell(props) {
                        const p = props.row.original as ProductItem;
                        return (
                          <Switch
                            checked={p.status === "ACTIVE"}
                            onCheckedChange={() => handleToggleStatus(p as any)}
                          />
                        );
                      },
                    },
                  ]}
                  rowActions={(row: ProductItem) => [
                    ...(row.type === "TICKET"
                      ? [
                        {
                          icon: Eye,
                          variant: "ghost" as const,
                          className:
                            "h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600",
                          onClick(r: ProductItem) {
                            setSelectedProduct(r);
                            setShowTicketDetail(true);
                          },
                        },
                      ]
                      : []),
                    {
                      icon: PenBox,
                      variant: "ghost" as const,
                      className:
                        "h-8 w-8 hover:bg-primary/10 hover:text-primary",
                      onClick(r: ProductItem) {
                        setSelectedProduct(r);
                        setAction("edit");
                        setShowAddOrEditModal(true);
                      },
                    },
                    {
                      icon: Trash2,
                      variant: "ghost" as const,
                      className:
                        "h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600",
                      onClick(r: ProductItem) {
                        setSelectedProduct(r);
                        setShowDeleteModal(true);
                      },
                    },
                  ]}
                  actionViewType="flex"
                  enableColumnResizing
                />
              </TabsContent>
            ))}
          <TabsContent value="categories" className="mt-3" data-guide="products-categories">
            {selectedOutlet ? (
              <CategoryManager outletId={selectedOutlet} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Pilih outlet terlebih dahulu
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddOrEditProductServiceModal
        action={action}
        open={showAddOrEditModal}
        onOpenChange={setShowAddOrEditModal}
        outletId={selectedOutlet || null}
        data={selectedProduct}
        initialData={{ ...selectedProduct }}
        onSuccess={() => {
          handleRefreshData();
          if (action === "edit") setSelectedProduct(null);
        }}
      />

      <ImportDataModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        outletId={selectedOutlet || null}
        onImported={handleRefreshData}
      />

      {showDeleteModal && selectedProduct && (
        <ConfirmationModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          description={`Yakin ingin menghapus produk '${selectedProduct.name}'? Tindakan ini tidak dapat dibatalkan.`}
          title="Konfirmasi Hapus"
          onConfirm={() => handleDelete(selectedProduct.id)}
          confirmVariant="destructive"
          loading={actionLoading}
        />
      )}

      <TicketDetailDialog
        product={selectedProduct}
        open={showTicketDetail}
        onOpenChange={setShowTicketDetail}
      />
    </>
  );
}
