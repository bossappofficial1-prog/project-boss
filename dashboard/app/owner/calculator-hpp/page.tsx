"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatCurrency, cn } from "@/lib/utils";
import { useAutoSaveCalchpp } from "@/stores/use-auto-save-calchpp";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/lib/apis/product";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type BusinessType = "manufaktur" | "dagang" | "fnb" | "jasa" | "custom";

const PRESETS: Record<
  BusinessType,
  {
    label: string;
    unitLabel: string;
    categories: {
      name: string;
      items: { name: string; quantity: number; unitCost: number }[];
    }[];
  }
> = {
  manufaktur: {
    label: "Manufaktur",
    unitLabel: "unit produksi",
    categories: [
      {
        name: "Bahan Baku",
        items: [
          { name: "Bahan baku utama", quantity: 1, unitCost: 0 },
          { name: "Bahan penolong", quantity: 1, unitCost: 0 },
        ],
      },
      {
        name: "Tenaga Kerja Langsung",
        items: [{ name: "Upah operator", quantity: 1, unitCost: 0 }],
      },
      {
        name: "Overhead Pabrik",
        items: [
          { name: "Listrik & air (dialokasi)", quantity: 1, unitCost: 0 },
          { name: "Penyusutan mesin (dialokasi)", quantity: 1, unitCost: 0 },
          { name: "Biaya pemeliharaan (dialokasi)", quantity: 1, unitCost: 0 },
        ],
      },
    ],
  },
  dagang: {
    label: "Perdagangan",
    unitLabel: "unit barang",
    categories: [
      {
        name: "Harga Pokok Pembelian",
        items: [
          { name: "Harga beli barang", quantity: 1, unitCost: 0 },
          { name: "Diskon pembelian", quantity: -1, unitCost: 0 },
        ],
      },
      {
        name: "Biaya Pengadaan",
        items: [
          { name: "Ongkos kirim masuk", quantity: 1, unitCost: 0 },
          { name: "Biaya bongkar muat", quantity: 1, unitCost: 0 },
          { name: "Pajak impor", quantity: 1, unitCost: 0 },
        ],
      },
      {
        name: "Biaya Penyimpanan",
        items: [
          { name: "Sewa gudang (dialokasi)", quantity: 1, unitCost: 0 },
          { name: "Asuransi barang", quantity: 1, unitCost: 0 },
        ],
      },
    ],
  },
  fnb: {
    label: "F&B / Kuliner",
    unitLabel: "porsi",
    categories: [
      {
        name: "Bahan Baku",
        items: [
          { name: "Bahan utama", quantity: 1, unitCost: 0 },
          { name: "Bumbu & rempah", quantity: 1, unitCost: 0 },
          { name: "Minuman / pelengkap", quantity: 1, unitCost: 0 },
        ],
      },
      {
        name: "Kemasan",
        items: [
          { name: "Box / wadah", quantity: 1, unitCost: 0 },
          { name: "Label / stiker", quantity: 1, unitCost: 0 },
          { name: "Kantong plastik", quantity: 1, unitCost: 0 },
        ],
      },
      {
        name: "Biaya Produksi",
        items: [
          { name: "Gas / listrik (dialokasi)", quantity: 1, unitCost: 0 },
          { name: "Upah juru masak (dialokasi)", quantity: 1, unitCost: 0 },
        ],
      },
    ],
  },
  jasa: {
    label: "Jasa",
    unitLabel: "pekerjaan / proyek",
    categories: [
      {
        name: "Biaya SDM",
        items: [
          { name: "Honor / gaji tenaga ahli", quantity: 1, unitCost: 0 },
          { name: "Tunjangan & benefit", quantity: 1, unitCost: 0 },
        ],
      },
      {
        name: "Biaya Operasional",
        items: [
          { name: "Alat & perlengkapan", quantity: 1, unitCost: 0 },
          { name: "Transportasi / perjalanan", quantity: 1, unitCost: 0 },
          { name: "Software / lisensi (dialokasi)", quantity: 1, unitCost: 0 },
        ],
      },
      {
        name: "Overhead",
        items: [
          { name: "Sewa kantor (dialokasi)", quantity: 1, unitCost: 0 },
          { name: "Listrik & internet (dialokasi)", quantity: 1, unitCost: 0 },
        ],
      },
    ],
  },
  custom: {
    label: "Custom",
    unitLabel: "unit",
    categories: [
      { name: "Biaya Langsung", items: [] },
      { name: "Biaya Tidak Langsung", items: [] },
    ],
  },
};

export default function HppCalculator() {
  const {
    businessType,
    units,
    preset,
    setBusinessType,
    setUnits,
    setTargetMargin,
    targetMargin,
    addCategory,
    removeCategory,
    updateItem,
    addItem,
    removeItem,
    toggleCollapse,
    updateCategoryName,
  } = useAutoSaveCalchpp();

  const { selectedOutletId } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<string>("none");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ["products", selectedOutletId, "GOODS"],
    queryFn: () => productApi.getByOutlet(selectedOutletId!, { type: "GOODS", limit: 100 }),
    enabled: !!selectedOutletId,
  });

  const products = productsData?.data || [];
  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  const applyMutation = useMutation({
    mutationFn: async (payload: { price: number; hpp: number }) => {
      if (!selectedProductId) throw new Error("No product selected");
      return productApi.update(selectedProductId, { type: "GOODS", goods: { sellingPrice: payload.price, averageHpp: payload.hpp } } as any);
    },
    onSuccess: () => {
      toast.success("HPP dan Harga Jual berhasil diterapkan ke produk");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menerapkan harga jual");
    }
  });

  const categories = preset[businessType].categories;

  const handleBusinessTypeChange = (value: BusinessType) => {
    setBusinessType(value);
  };

  const { totalBiaya, hppPerUnit, hargaJual, categoryTotals } = useMemo(() => {
    const categoryTotals = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      total: cat.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      ),
    }));
    const totalBiaya = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
    const safeUnits = units > 0 ? units : 1;
    const hppPerUnit = totalBiaya / safeUnits;
    const hargaJual = hppPerUnit / (1 - targetMargin / 100);
    return { totalBiaya, hppPerUnit, hargaJual, categoryTotals };
  }, [categories, units, targetMargin]);

  const unitLabel = preset[businessType].unitLabel;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kalkulator HPP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hitung Harga Pokok Penjualan untuk berbagai jenis bisnis
          </p>
        </div>

        <Badge variant="outline" className="text-sm px-3 py-1">
          {preset[businessType].label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* Integrasi Produk */}
          <Card className="py-0 gap-0 shadow-none border-border/50 bg-primary/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Integrasi Produk</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-xs text-muted-foreground">Pilih Produk untuk Dihubungkan</Label>
                  <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isComboboxOpen}
                        className="w-full justify-between rounded-md bg-background border-border font-normal"
                      >
                        {selectedProductId && selectedProductId !== "none"
                          ? products.find((p: any) => p.id === selectedProductId)?.name
                          : "-- Tidak ada produk yang dipilih --"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari produk..." />
                        <CommandList>
                          <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                setSelectedProductId("none");
                                setIsComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProductId === "none" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              -- Tidak ada produk yang dipilih --
                            </CommandItem>
                            {products.map((p: any) => (
                              <CommandItem
                                key={p.id}
                                value={p.id}
                                keywords={[p.name]}
                                onSelect={(currentValue) => {
                                  setSelectedProductId(currentValue === selectedProductId ? "none" : currentValue);
                                  setIsComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductId === p.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {p.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {selectedProduct && (
                  <Button 
                    variant="outline" 
                    className="w-full md:w-auto bg-background"
                    onClick={() => {
                      if (!selectedProduct?.goods?.averageHpp) {
                        toast.error("Produk ini belum memiliki HPP (Stok kosong)");
                        return;
                      }
                      const firstCat = categories[0];
                      if (firstCat && firstCat.items.length > 0) {
                        updateItem(firstCat.id, firstCat.items[0].id, "unitCost", selectedProduct.goods.averageHpp);
                        toast.success("HPP berhasil dimuat ke kalkulator");
                      } else {
                        toast.error("Kategori kalkulator kosong");
                      }
                    }}
                  >
                    Muat HPP Sistem (Rp {selectedProduct.goods?.averageHpp.toLocaleString('id-ID')})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Config */}
          <Card className="py-0 gap-0 shadow-none border-border/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Jenis Bisnis</Label>
                  <Select
                    value={businessType}
                    onValueChange={handleBusinessTypeChange}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(preset) as BusinessType[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {preset[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Jumlah {unitLabel}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={units}
                    onChange={(e) => setUnits(parseFloat(e.target.value) || 1)}
                    className="rounded-md"
                    placeholder="Contoh: 100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Target Margin (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={targetMargin}
                    onChange={(e) => {
                      setTargetMargin(parseFloat(e.target.value) || 0);
                    }}
                    className="rounded-md"
                    placeholder="Contoh: 30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <div className="space-y-4">
            {categories.map((cat) => {
              const catTotal =
                categoryTotals.find((c) => c.id === cat.id)?.total ?? 0;
              return (
                <Card
                  key={cat.id}
                  className="py-0 gap-0 shadow-none border-border/50"
                >
                  <CardHeader className="p-4 pb-0">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(cat.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {cat.collapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                      <Input
                        value={cat.name}
                        onChange={(e) =>
                          updateCategoryName(cat.id, e.target.value)
                        }
                        className="border-0 shadow-none p-0 h-auto font-medium text-base focus-visible:ring-0 bg-transparent"
                      />
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(catTotal)}
                        </span>
                        {categories.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeCategory(cat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {!cat.collapsed && (
                    <CardContent className="p-4 pt-3 space-y-2">
                      {/* Column headers */}
                      {cat.items.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 px-1">
                          <span className="col-span-5 text-xs text-muted-foreground">
                            Nama Biaya
                          </span>
                          <span className="col-span-2 text-xs text-muted-foreground text-right">
                            Qty
                          </span>
                          <span className="col-span-3 text-xs text-muted-foreground text-right">
                            Harga Satuan
                          </span>
                          <span className="col-span-2 text-xs text-muted-foreground text-right">
                            Subtotal
                          </span>
                        </div>
                      )}

                      {cat.items.map((item) => {
                        const subtotal = item.quantity * item.unitCost;
                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <Input
                              className="col-span-5 rounded-md h-8 text-sm"
                              placeholder="Nama biaya"
                              value={item.name}
                              onChange={(e) =>
                                updateItem(
                                  cat.id,
                                  item.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              className="col-span-2 rounded-md h-8 text-sm text-right"
                              type="number"
                              placeholder="1"
                              value={item.quantity || ""}
                              onChange={(e) =>
                                updateItem(
                                  cat.id,
                                  item.id,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              className="col-span-3 rounded-md h-8 text-sm text-right"
                              type="number"
                              placeholder="0"
                              value={item.unitCost || ""}
                              onChange={(e) =>
                                updateItem(
                                  cat.id,
                                  item.id,
                                  "unitCost",
                                  e.target.value,
                                )
                              }
                            />
                            <div className="col-span-2 flex items-center justify-end gap-1">
                              <span className="text-xs text-muted-foreground tabular-nums truncate">
                                {formatCurrency(subtotal)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(cat.id, item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-1 mt-1"
                        onClick={() =>
                          addItem(cat.id, `Biaya baru ${cat.items.length + 1}`)
                        }
                      >
                        <Plus className="h-3 w-3" />
                        Tambah item
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-md"
              onClick={() => addCategory("Kategori Baru")}
            >
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </Button>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card className="py-0 gap-0 shadow-none border-border/50 sticky top-6">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Hasil Perhitungan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Category breakdown */}
              <div className="space-y-2">
                {categoryTotals.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground truncate pr-2">
                      {cat.name}
                    </span>
                    <span className="tabular-nums shrink-0">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Total biaya */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Biaya</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(totalBiaya)}
                </span>
              </div>

              {/* Unit */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Jumlah {unitLabel}</span>
                <span className="tabular-nums">
                  {units.toLocaleString("id-ID")} {unitLabel}
                </span>
              </div>

              <Separator />

              {/* HPP per unit */}
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  HPP per {unitLabel}
                </p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                  {formatCurrency(hppPerUnit)}
                </p>
              </div>

              {/* Harga Jual */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Harga Jual (margin {targetMargin}%)
                </p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums text-primary">
                  {formatCurrency(hargaJual)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Laba per unit:{" "}
                  <span className="text-foreground font-medium">
                    {formatCurrency(hargaJual - hppPerUnit)}
                  </span>
                </p>
              </div>

              {/* Gross Profit per batch */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Laba kotor ({units.toLocaleString("id-ID")} {unitLabel})
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency((hargaJual - hppPerUnit) * units)}
                </span>
              </div>

              {selectedProduct && (
                <>
                  <Separator />
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Produk Terpilih</span>
                      <span className="font-medium text-right max-w-[150px] truncate" title={selectedProduct.name}>{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Harga Jual Saat Ini</span>
                      <span className="font-medium text-muted-foreground line-through">
                        {formatCurrency(selectedProduct.goods?.sellingPrice || 0)}
                      </span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={applyMutation.isPending}
                    >
                      Terapkan HPP & Harga ke Sistem
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Terapkan Hasil Kalkulator"
        description={<>Apakah Anda yakin ingin memperbarui data produk <b>{selectedProduct?.name}</b> di sistem?<br/><br/>HPP akan diubah menjadi <b className="text-primary">{formatCurrency(hppPerUnit)}</b><br/>Harga Jual akan diubah menjadi <b className="text-primary">{formatCurrency(hargaJual)}</b></>}
        confirmLabel="Ya, Terapkan"
        confirmLoadingLabel="Menerapkan..."
        confirmVariant="default"
        onConfirm={() => applyMutation.mutateAsync({ price: hargaJual, hpp: hppPerUnit })}
      />
    </div>
  );
}
