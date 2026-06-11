"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Truck,
  Package,
  Trash2,
  Pencil,
  MoreHorizontal,
  FileText,
  Boxes,
  Layers,
  Sparkles,
  ArrowDownUp,
  History,
  AlertTriangle,
  Coins,
  CheckCircle,
} from "lucide-react";
import { useOutletStore } from "@/stores/outlet.store";
import {
  useIngredients,
  useIngredientDetail,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useAddIngredientStock,
  useAdjustIngredientStock,
} from "@/hooks/api/use-ingredients";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ReusableForm, type FormFieldConfig } from "@/components/ui/reuseable-form";
import { z } from "zod";
import type { Ingredient } from "@/lib/apis/ingredient";

// Form Validation Schemas
const ingredientSchema = z.object({
  name: z.string().min(1, "Nama bahan baku wajib diisi"),
  purchaseUnit: z.string().min(1, "Satuan beli wajib diisi"),
  recipeUnit: z.string().min(1, "Satuan resep wajib diisi"),
  conversionFactor: z.coerce.number().min(0.0001, "Faktor konversi harus lebih dari 0"),
  minStock: z.coerce.number().min(0).optional().nullable(),
});

const stockSchema = z.object({
  quantity: z.coerce.number().min(0.0001, "Kuantitas beli harus lebih dari 0"),
  totalCost: z.coerce.number().min(0, "Total biaya pembelian tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

const adjustSchema = z.object({
  quantity: z.coerce.number().refine((val) => val !== 0, { message: "Penyesuaian tidak boleh 0" }),
  notes: z.string().min(1, "Alasan penyesuaian wajib diisi"),
});

export function IngredientContent() {
  const { selectedOutletId, isLoading: outletLoading } = useOutletStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);

  // Focus target state
  const [activeIngredientId, setActiveIngredientId] = useState<string | null>(null);

  // Debounced search trigger
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // API Queries & Mutations
  const { data: ingredientsRaw, isLoading } = useIngredients(selectedOutletId || undefined);
  const { data: ingredientDetail, isLoading: detailLoading } = useIngredientDetail(activeIngredientId);

  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const addStockMutation = useAddIngredientStock();
  const adjustStockMutation = useAdjustIngredientStock();

  const ingredients = useMemo(() => {
    const raw = ingredientsRaw || [];
    if (!debouncedSearch.trim()) return raw;
    return raw.filter((item: Ingredient) =>
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [ingredientsRaw, debouncedSearch]);

  const activeIngredient = useMemo(() => {
    return ingredientsRaw?.find((item: Ingredient) => item.id === activeIngredientId) || null;
  }, [ingredientsRaw, activeIngredientId]);

  // Open Handlers
  const handleOpenCreate = () => {
    setCreateOpen(true);
  };

  const handleOpenEdit = (ingredient: Ingredient) => {
    setActiveIngredientId(ingredient.id);
    setEditOpen(true);
  };

  const handleOpenStock = (ingredient: Ingredient) => {
    setActiveIngredientId(ingredient.id);
    setStockOpen(true);
  };

  const handleOpenAdjust = (ingredient: Ingredient) => {
    setActiveIngredientId(ingredient.id);
    setAdjustOpen(true);
  };

  const handleOpenDetail = (ingredient: Ingredient) => {
    setActiveIngredientId(ingredient.id);
    setDetailOpen(true);
  };

  // Submit Handlers
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Bahan baku "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menghapus bahan baku");
    }
  };

  const handleCreateSubmit = async (values: z.infer<typeof ingredientSchema>) => {
    if (!selectedOutletId) return;

    try {
      await createMutation.mutateAsync({
        name: values.name,
        purchaseUnit: values.purchaseUnit,
        recipeUnit: values.recipeUnit,
        conversionFactor: values.conversionFactor,
        minStock: values.minStock ? Number(values.minStock) : undefined,
        outletId: selectedOutletId,
      });
      toast.success("Bahan baku berhasil didaftarkan");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat bahan baku");
    }
  };

  const handleUpdateSubmit = async (values: z.infer<typeof ingredientSchema>) => {
    if (!activeIngredientId) return;

    try {
      await updateMutation.mutateAsync({
        id: activeIngredientId,
        payload: {
          name: values.name,
          purchaseUnit: values.purchaseUnit,
          recipeUnit: values.recipeUnit,
          conversionFactor: values.conversionFactor,
          minStock: values.minStock ? Number(values.minStock) : null,
        },
      });
      toast.success("Bahan baku berhasil diperbarui");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui bahan baku");
    }
  };

  const handleAddStockSubmit = async (values: z.infer<typeof stockSchema>) => {
    if (!activeIngredientId) return;

    try {
      await addStockMutation.mutateAsync({
        id: activeIngredientId,
        payload: {
          quantity: values.quantity,
          totalCost: values.totalCost,
          notes: values.notes || undefined,
        },
      });
      toast.success("Stok baru berhasil masuk (FIFO batch terdaftar)");
      setStockOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memasukkan stok");
    }
  };

  const handleAdjustStockSubmit = async (values: z.infer<typeof adjustSchema>) => {
    if (!activeIngredientId) return;

    try {
      await adjustStockMutation.mutateAsync({
        id: activeIngredientId,
        payload: {
          quantity: values.quantity,
          notes: values.notes,
        },
      });
      toast.success("Stok berhasil disesuaikan");
      setAdjustOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyesuaikan stok");
    }
  };

  // ReusableForm fields configurations
  const ingredientFields = useMemo<FormFieldConfig<any>[]>(() => [
    {
      name: "name",
      label: "Nama Bahan Mentah",
      type: "text",
      placeholder: "Contoh: Susu Cair Full Cream, Espresso Blend",
    },
    {
      name: "purchaseUnit",
      label: "Satuan Beli (Bulk)",
      type: "text",
      placeholder: "Contoh: kg, Liter, Karton",
      colSpan: 1,
    },
    {
      name: "recipeUnit",
      label: "Satuan Resep (Terkecil)",
      type: "text",
      placeholder: "Contoh: gram, ml, pcs",
      colSpan: 1,
    },
    {
      name: "conversionFactor",
      label: "Faktor Konversi",
      type: "number",
      placeholder: "Berapa satuan resep dalam 1 satuan beli",
      description: "Contoh: 1000 jika 1 kg = 1000g",
      colSpan: 1,
    },
    {
      name: "minStock",
      label: "Batas Stok Minimum (Opsional)",
      type: "number",
      placeholder: "Batas peringatan tipis",
      colSpan: 1,
    },
  ], []);

  const editDefaultValues = useMemo(() => ({
    name: activeIngredient?.name ?? "",
    purchaseUnit: activeIngredient?.purchaseUnit ?? "",
    recipeUnit: activeIngredient?.recipeUnit ?? "",
    conversionFactor: activeIngredient?.conversionFactor ?? 1,
    minStock: activeIngredient?.minStock ?? null,
  }), [activeIngredient]);

  const stockFields = useMemo<FormFieldConfig<any>[]>(() => [
    {
      name: "quantity",
      label: "Kuantitas Pembelian",
      type: "number",
      placeholder: "Contoh: 5, 2.5",
      colSpan: 1,
    },
    {
      name: "totalCost",
      label: "Total Biaya Pembelian (Rp)",
      type: "currency",
      placeholder: "Contoh: 150000",
      colSpan: 1,
    },
    {
      name: "notes",
      label: "Catatan Pembelian (Opsional)",
      type: "textarea",
      placeholder: "Contoh: Beli di Supplier Makmur Jaya, Batch Expire Nov 2026",
      colSpan: 2,
    },
    {
      name: "preview",
      label: "",
      type: "custom",
      colSpan: 2,
      renderCustom: ({ form }) => {
        const qty = Number(form.watch("quantity"));
        const cost = Number(form.watch("totalCost"));
        if (!qty || !cost || !activeIngredient) return null;
        const convertedQty = qty * activeIngredient.conversionFactor;
        const calculatedUnitCost = convertedQty > 0 ? cost / convertedQty : 0;
        return (
          <div className="p-3.5 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl space-y-1.5 text-xs text-emerald-800 mt-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Coins className="h-4 w-4 text-emerald-600" />
              <span>Rangkuman Konversi Sistem (FIFO)</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-muted-foreground">
              <li>Total stok dikonversi menjadi: <b className="text-foreground">{convertedQty.toLocaleString("id-ID")} {activeIngredient.recipeUnit}</b></li>
              <li>Harga satuan resep final: <b className="text-foreground">{formatCurrency(calculatedUnitCost)} / {activeIngredient.recipeUnit}</b></li>
            </ul>
          </div>
        );
      }
    }
  ], [activeIngredient]);

  const adjustFields = useMemo<FormFieldConfig<any>[]>(() => [
    {
      name: "quantity",
      label: "Kuantitas Penyesuaian (Satuan Resep)",
      type: "number",
      placeholder: "Contoh: -50 (jika tumpah 50g), 100 (jika surplus 100g)",
      description: "Gunakan tanda minus (-) untuk pengurangan stok, dan angka positif untuk surplus stok.",
    },
    {
      name: "notes",
      label: "Alasan Penyesuaian",
      type: "textarea",
      placeholder: "Contoh: Bahan tumpah saat racik kopi, Opname akhir bulan",
    },
  ], []);

  if (outletLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedOutletId) {
    return (
      <EmptyOutletState onAddOutlet={() => router.push("/owner#add-outlet")} />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <SectionHeader
        title="Bahan Baku (Raw Ingredients)"
        description="Kelola persediaan bahan mentah, batch harga pembelian, dan konversi ke resep menu dengan presisi FIFO."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            Tambah Bahan Baku
          </Button>
        }
      />

      {/* Search and Quick Alert */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari bahan baku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 border-border/80 focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] py-1 border-primary/20 bg-primary/5 text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Metode FIFO Aktif
          </Badge>
        </div>
      </div>

      {/* Ingredient List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Boxes className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground/70">
              {debouncedSearch ? "Bahan baku tidak ditemukan" : "Belum ada bahan baku"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              {debouncedSearch
                ? "Coba kata kunci pencarian yang lain."
                : "Tambahkan bahan mentah seperti Kopi Bubuk, Susu, Gula untuk dikaitkan dengan menu Anda."}
            </p>
            {!debouncedSearch && (
              <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4" />
                Tambah Bahan Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((item: Ingredient) => {
            const isLowStock = item.minStock !== null && item.currentStock <= item.minStock;
            const isNegative = item.currentStock < 0;

            return (
              <Card
                key={item.id}
                className={`group relative overflow-hidden py-0 rounded-xl border border-border bg-card/60 backdrop-blur-xs shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 ${
                  isNegative
                    ? "border-red-500/20 bg-red-500/[0.01]"
                    : isLowStock
                    ? "border-amber-500/20 bg-amber-500/[0.01]"
                    : ""
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isNegative
                          ? "bg-red-500/10 text-red-500"
                          : isLowStock
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-primary/10 text-primary"
                      }`}>
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          1 {item.purchaseUnit} = {item.conversionFactor} {item.recipeUnit}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border-border/80">
                        <DropdownMenuItem onClick={() => handleOpenStock(item)} className="text-xs font-semibold text-primary">
                          <Truck className="h-3.5 w-3.5 mr-2" />
                          Beli Stok (IN)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenAdjust(item)} className="text-xs font-semibold text-amber-600">
                          <ArrowDownUp className="h-3.5 w-3.5 mr-2" />
                          Penyesuaian (Adj)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDetail(item)} className="text-xs font-semibold">
                          <History className="h-3.5 w-3.5 mr-2" />
                          Lihat Riwayat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(item)} className="text-xs">
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(item)} className="text-xs text-red-600 focus:text-red-700">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stock Metrics */}
                  <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/20 text-xs">
                    <div>
                      <p className="text-muted-foreground text-[10px]">Stok Tersedia</p>
                      <p className={`font-bold mt-0.5 ${
                        isNegative ? "text-red-600" : isLowStock ? "text-amber-600" : "text-foreground"
                      }`}>
                        {item.currentStock.toLocaleString("id-ID")} {item.recipeUnit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Estimasi HPP Unit</p>
                      <p className="font-bold mt-0.5 text-foreground">
                        {formatCurrency(item.averageCost)} / {item.recipeUnit}
                      </p>
                    </div>
                  </div>

                  {/* Warning Indicators */}
                  {isNegative ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600 bg-red-500/5 p-1.5 rounded-md border border-red-500/10">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Stok defisit! Transaksi kasir tetap berjalan.</span>
                    </div>
                  ) : isLowStock ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 bg-amber-500/5 p-1.5 rounded-md border border-amber-500/10">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Stok menipis! (Min: {item.minStock} {item.recipeUnit})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-500/5 p-1.5 rounded-md border border-emerald-500/10">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Kondisi persediaan sehat.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE DIALOG */}
      <ReusableForm<z.infer<typeof ingredientSchema>>
        withDialog
        isDialogOpen={createOpen}
        onDialogOpenChange={setCreateOpen}
        dialogTitle="Tambah Bahan Baku Baru"
        dialogDescription="Daftarkan bahan baku mentah Anda beserta rumus konversi satuan dari pembelian ke resep."
        schema={ingredientSchema}
        defaultValues={{
          name: "",
          purchaseUnit: "",
          recipeUnit: "",
          conversionFactor: 1,
          minStock: null,
        }}
        fields={ingredientFields}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
        submitText="Daftarkan Bahan"
        cancelText="Batal"
        gridCols={2}
      />

      {/* EDIT DIALOG */}
      <ReusableForm<z.infer<typeof ingredientSchema>>
        withDialog
        isDialogOpen={editOpen}
        onDialogOpenChange={setEditOpen}
        dialogTitle="Edit Detail Bahan Baku"
        dialogDescription="Sesuaikan informasi konversi atau batas stok minimum bahan baku."
        schema={ingredientSchema}
        defaultValues={editDefaultValues}
        fields={ingredientFields}
        onSubmit={handleUpdateSubmit}
        isLoading={updateMutation.isPending}
        submitText="Simpan Perubahan"
        cancelText="Batal"
        gridCols={2}
      />

      {/* STOCK IN (FIFO BATCH) DIALOG */}
      {activeIngredient && (
        <ReusableForm<z.infer<typeof stockSchema>>
          withDialog
          isDialogOpen={stockOpen}
          onDialogOpenChange={setStockOpen}
          dialogTitle={
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 animate-bounce" />
              <span>Beli / Input Stok Baru (FIFO)</span>
            </div>
          }
          dialogDescription={
            <div className="space-y-2 text-left">
              <p>Mencatat stok masuk baru ke sistem. FIFO akan mencatat batch pembelian ini secara presisi.</p>
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-1 text-xs mt-2">
                <span className="font-bold text-primary block">Bahan Terpilih: {activeIngredient.name}</span>
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  Saat ini: {activeIngredient.currentStock.toLocaleString("id-ID")} {activeIngredient.recipeUnit} (HPP Rata-rata: {formatCurrency(activeIngredient.averageCost)}/{activeIngredient.recipeUnit})
                </p>
              </div>
            </div>
          }
          schema={stockSchema}
          defaultValues={{
            quantity: 0,
            totalCost: 0,
            notes: "",
          }}
          fields={stockFields}
          onSubmit={handleAddStockSubmit}
          isLoading={addStockMutation.isPending}
          submitText="Simpan Stok Masuk"
          cancelText="Batal"
          gridCols={2}
        />
      )}

      {/* ADJUSTMENT STOCK DIALOG */}
      {activeIngredient && (
        <ReusableForm<z.infer<typeof adjustSchema>>
          withDialog
          isDialogOpen={adjustOpen}
          onDialogOpenChange={setAdjustOpen}
          dialogTitle={
            <div className="flex items-center gap-2 text-amber-600">
              <ArrowDownUp className="h-5 w-5" />
              <span>Penyesuaian Stok (Stock Adjustment)</span>
            </div>
          }
          dialogDescription={
            <div className="space-y-2 text-left">
              <p>Lakukan koreksi stok secara manual (misal: karena bahan tumpah, susut, atau lebih saat opname).</p>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1 text-xs mt-2">
                <span className="font-bold text-amber-600 block">Bahan Terpilih: {activeIngredient.name}</span>
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  Stok Sistem Saat Ini: {activeIngredient.currentStock.toLocaleString("id-ID")} {activeIngredient.recipeUnit}
                </p>
              </div>
            </div>
          }
          schema={adjustSchema}
          defaultValues={{
            quantity: 0,
            notes: "",
          }}
          fields={adjustFields}
          onSubmit={handleAdjustStockSubmit}
          isLoading={adjustStockMutation.isPending}
          submitText="Terapkan Koreksi"
          cancelText="Batal"
        />
      )}

      {/* DETAIL HISTORY SLIDEOVER / DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl border-border/80 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Rincian Stok & Riwayat FIFO
            </DialogTitle>
            <DialogDescription className="text-xs">
              Melihat rincian batch persediaan aktif serta mutasi log pergerakan keluar-masuk stok.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-40 rounded-md" />
            </div>
          ) : ingredientDetail ? (
            <div className="space-y-6 py-2 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/20">
                <div>
                  <span className="text-muted-foreground text-[10px] block">Nama Bahan</span>
                  <span className="font-bold text-foreground">{ingredientDetail.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Total Persediaan</span>
                  <span className="font-bold text-primary">{ingredientDetail.currentStock.toLocaleString("id-ID")} {ingredientDetail.recipeUnit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Rata-rata Harga</span>
                  <span className="font-bold text-foreground">{formatCurrency(ingredientDetail.averageCost)}/{ingredientDetail.recipeUnit}</span>
                </div>
              </div>

              {/* FIFO active batches */}
              <div className="space-y-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Boxes className="h-4 w-4 text-primary" /> Batch Stok Aktif (Urutan FIFO)
                </span>
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80">
                        <th className="p-3">Tanggal Masuk</th>
                        <th className="p-3 text-right">Stok Beli</th>
                        <th className="p-3 text-right">Tersisa</th>
                        <th className="p-3 text-right">Harga / Recipe Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-[11px]">
                      {ingredientDetail.batches.filter((b: any) => b.remainingQuantity !== 0).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            Tidak ada batch stok aktif saat ini.
                          </td>
                        </tr>
                      ) : (
                        ingredientDetail.batches
                          .filter((b: any) => b.remainingQuantity !== 0)
                          .map((batch: any) => (
                            <tr key={batch.id} className="hover:bg-muted/30">
                              <td className="p-3 text-muted-foreground font-semibold">
                                {new Date(batch.createdAt).toLocaleString("id-ID", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </td>
                              <td className="p-3 text-right text-foreground">
                                {batch.purchaseQuantity.toLocaleString("id-ID")} {ingredientDetail.recipeUnit}
                              </td>
                              <td className="p-3 text-right font-bold text-primary">
                                {batch.remainingQuantity.toLocaleString("id-ID")} {ingredientDetail.recipeUnit}
                              </td>
                              <td className="p-3 text-right font-semibold text-foreground">
                                {formatCurrency(batch.costPerRecipeUnit)}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mutation Stock Logs */}
              <div className="space-y-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Mutasi Log Pergerakan Stok (Terbaru)
                </span>
                <div className="border border-border/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80">
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Tipe</th>
                        <th className="p-3 text-right">Jumlah</th>
                        <th className="p-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-[11px]">
                      {ingredientDetail.stockLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            Belum ada riwayat mutasi stok.
                          </td>
                        </tr>
                      ) : (
                        ingredientDetail.stockLogs.map((log: any) => {
                          const isPositive = log.quantity > 0;
                          return (
                            <tr key={log.id} className="hover:bg-muted/30">
                              <td className="p-3 text-muted-foreground">
                                {new Date(log.createdAt).toLocaleString("id-ID", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-bold py-0.5 px-2 ${
                                    log.type === "IN"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : log.type === "POS_DEDUCTION"
                                      ? "border-blue-200 bg-blue-50 text-blue-700"
                                      : log.type === "ADJUSTMENT"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  {log.type}
                                </Badge>
                              </td>
                              <td className={`p-3 text-right font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                                {isPositive ? "+" : ""}{log.quantity.toLocaleString("id-ID")} {ingredientDetail.recipeUnit}
                              </td>
                              <td className="p-3 text-muted-foreground truncate max-w-[200px]" title={log.notes || "-"}>
                                {log.notes || "-"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Bahan Baku?"
        description={`Apakah Anda yakin ingin menghapus bahan baku "${deleteTarget?.name}"? Tindakan ini akan menghapus bahan baku ini dari seluruh resep menu produk terkait dan rekap stok akan hilang.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
export default IngredientContent;
