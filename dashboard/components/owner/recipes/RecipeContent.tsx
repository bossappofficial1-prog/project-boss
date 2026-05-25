"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  BookOpen,
  ChefHat,
  Package,
  ArrowRight,
  TrendingUp,
  Percent,
  Coins,
  ChevronRight,
  ClipboardList,
  Sparkles,
  UtensilsCrossed,
  Info,
  Search,
} from "lucide-react";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useIngredients } from "@/hooks/api/use-ingredients";
import { useProducts } from "@/hooks/useProducts";
import { ProductItem } from "@/hooks/useProductsData";
import type { Ingredient } from "@/lib/apis/ingredient";
import type { Recipe, RecipeIngredient } from "@/lib/apis/recipe";
import {
  useRecipeByProduct,
  useCreateRecipe,
  useAddRecipeIngredient,
  useRemoveRecipeIngredient,
  useUpdateRecipeNotes,
  useDeleteRecipe,
} from "@/hooks/api/use-recipes";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RecipeContent() {
  const { selectedOutletId, isLoading: outletLoading } = useOutletContext();
  const router = useRouter();

  // Selected state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  // Add ingredient form state
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  // Search products state
  const [productSearch, setProductSearch] = useState("");

  // API Queries & Mutations
  const { data: ingredients, isLoading: ingredientsLoading } = useIngredients(
    selectedOutletId || undefined,
  );
  const { data: productsData, isLoading: productsLoading } = useProducts(
    selectedOutletId || "",
    { limit: 100 },
  );

  const { data: activeRecipe, isLoading: recipeLoading } = useRecipeByProduct(
    selectedProductId || undefined,
  );

  const createRecipeMutation = useCreateRecipe();
  const addIngredientMutation = useAddRecipeIngredient();
  const removeIngredientMutation = useRemoveRecipeIngredient();
  const updateNotesMutation = useUpdateRecipeNotes();
  const deleteRecipeMutation = useDeleteRecipe();

  // Filter goods fnb products
  const products = useMemo(() => {
    const raw = (productsData as unknown as ProductItem[]) || [];
    // Only GOODS products are eligible for recipes
    const goodsProducts = raw.filter((p: ProductItem) => p.type === "GOODS");

    if (!productSearch.trim()) return goodsProducts;
    return goodsProducts.filter((p: ProductItem) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [productsData, productSearch]);

  const selectedProduct = useMemo(() => {
    return (
      (productsData as unknown as ProductItem[])?.find(
        (p: ProductItem) => p.id === selectedProductId,
      ) || null
    );
  }, [productsData, selectedProductId]);

  // Available ingredients for selection (excluding those already in the recipe)
  const availableIngredients = useMemo(() => {
    const all = ingredients || [];
    if (!activeRecipe) return all;

    const usedIds = new Set(
      activeRecipe.ingredients.map((i: RecipeIngredient) => i.ingredientId),
    );
    return all.filter((i: Ingredient) => !usedIds.has(i.id));
  }, [ingredients, activeRecipe]);

  // Selected ingredient unit for form display helper
  const selectedIngredientUnit = useMemo(() => {
    if (!selectedIngredientId || !ingredients) return "";
    return (
      ingredients.find((i: Ingredient) => i.id === selectedIngredientId)
        ?.recipeUnit || ""
    );
  }, [selectedIngredientId, ingredients]);

  // Live calculation results
  const marginSummary = useMemo(() => {
    if (!selectedProduct || !activeRecipe) return null;

    let totalRecipeHpp = 0;
    for (const ri of activeRecipe.ingredients) {
      totalRecipeHpp += ri.quantity * ri.ingredient.averageCost;
    }

    const sellingPrice = selectedProduct.goods?.sellingPrice || 0;
    const profit = sellingPrice - totalRecipeHpp;
    const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      totalRecipeHpp: Math.round(totalRecipeHpp * 100) / 100,
      sellingPrice,
      profit: Math.round(profit * 100) / 100,
      marginPct: Math.round(marginPct * 10) / 10,
    };
  }, [selectedProduct, activeRecipe]);

  // Handlers
  const handleCreateRecipe = async () => {
    if (!selectedProductId) return;
    try {
      await createRecipeMutation.mutateAsync({ productId: selectedProductId });
      toast.success("Resep menu berhasil diinisialisasi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat resep");
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedProductId ||
      !selectedIngredientId ||
      !quantity ||
      !activeRecipe
    )
      return;

    try {
      await addIngredientMutation.mutateAsync({
        recipeId: activeRecipe.id,
        payload: {
          ingredientId: selectedIngredientId,
          quantity: Number(quantity),
        },
      });
      toast.success("Bahan baku ditambahkan ke resep");
      setSelectedIngredientId("");
      setQuantity("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Gagal menambahkan bahan ke resep",
      );
    }
  };

  const handleRemoveIngredient = async (ingredientId: string) => {
    if (!activeRecipe) return;
    try {
      await removeIngredientMutation.mutateAsync({
        recipeId: activeRecipe.id,
        ingredientId,
      });
      toast.success("Bahan baku dihapus dari resep");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menghapus bahan");
    }
  };

  const handleDeleteRecipe = async () => {
    if (!activeRecipe) return;
    try {
      await deleteRecipeMutation.mutateAsync(activeRecipe.id);
      toast.success("Resep menu berhasil dihapus");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menghapus resep");
    }
  };

  if (outletLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-100 w-full" />
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
        title="Resep Menu & HPP (Bill of Materials)"
        description="Petakan menu hidangan Anda ke bahan-bahan baku, pantau HPP secara otomatis, serta hitung margin keuntungan riil."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product List Picker */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/80 py-0 gap-0 bg-card/50 backdrop-blur-xs rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="p-4 border-b border-border/80 bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" /> Daftar Menu
                Makanan/Minuman
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari menu produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-border focus-visible:ring-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 divide-y divide-border/40 max-h-125 overflow-y-auto">
              {productsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full my-1 rounded-md" />
                ))
              ) : products.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Tidak ada menu untuk resep.
                </p>
              ) : (
                products.map((p: ProductItem) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition-all ${
                        isSelected
                          ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/20"
                          : "text-foreground hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Harga Jual:{" "}
                          {formatCurrency(p.goods?.sellingPrice || 0)}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected
                            ? "text-primary translate-x-0.5"
                            : "text-muted-foreground/50"
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Recipe Editor Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedProductId ? (
            <Card className="border-dashed border-border/80 bg-card/20 py-20 text-center rounded-xl shadow-xs">
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ChefHat className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
                </div>
                <h3 className="font-bold text-sm text-foreground/80">
                  Ruang Kerja Resep
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-70">
                  Pilih salah satu menu di bilah kiri untuk menyusun resep dan
                  melacak biaya HPP bahan baku.
                </p>
              </CardContent>
            </Card>
          ) : recipeLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-56 w-full rounded-md" />
            </div>
          ) : !activeRecipe ? (
            /* Selected but has no recipe yet */
            <Card className="border border-border bg-card/60 backdrop-blur-xs rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <ChefHat className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  Belum Ada Resep Terdaftar
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-85">
                  Menu <b>{selectedProduct?.name}</b> belum terhubung ke resep
                  bahan baku mana pun. Buat resep untuk mengotomatisasi
                  pengurangan stok FIFO.
                </p>
                <Button
                  onClick={handleCreateRecipe}
                  className="mt-5 gap-2 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  <Plus className="h-4 w-4" />
                  Mulai Susun Resep
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Active recipe workspace */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Product and Notes Info */}
              <Card className="border-border/80 py-0 bg-card/50 backdrop-blur-xs rounded-xl shadow-sm">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                      Workspace Resep
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-0.5">
                      {selectedProduct?.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />{" "}
                      Pengurangan bahan baku otomatis aktif ketika POS
                      diselesaikan.
                    </p>
                  </div>
                  <Button
                    onClick={handleDeleteRecipe}
                    variant="outline"
                    className="text-xs font-semibold text-red-600 border-red-500/20 hover:bg-red-500/5 mt-2 md:mt-0 shrink-0 self-start md:self-center"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Hapus Resep
                  </Button>
                </CardContent>
              </Card>

              {/* Recipe Ingredients list */}
              <Card className="border border-border/80 py-0 gap-0 rounded-xl shadow-sm overflow-hidden bg-card/50 backdrop-blur-xs">
                <CardHeader className="p-4 border-b border-border/80 bg-muted/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-primary" /> Bahan
                    Baku Penyusun Resep
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80">
                        <th className="p-4">Nama Bahan</th>
                        <th className="p-4 text-right">Takaran Resep</th>
                        <th className="p-4 text-right">Harga Satuan (HPP)</th>
                        <th className="p-4 text-right">Total Biaya HPP</th>
                        <th className="p-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-xs">
                      {activeRecipe.ingredients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-muted-foreground font-medium"
                          >
                            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2 animate-bounce" />
                            Resep masih kosong. Silakan tambahkan bahan baku di
                            bawah.
                          </td>
                        </tr>
                      ) : (
                        activeRecipe.ingredients.map((ri: RecipeIngredient) => {
                          const costContribution =
                            ri.quantity * ri.ingredient.averageCost;
                          return (
                            <tr key={ri.id} className="hover:bg-muted/10">
                              <td className="p-4 font-semibold text-foreground">
                                {ri.ingredient.name}
                              </td>
                              <td className="p-4 text-right font-bold text-foreground">
                                {ri.quantity.toLocaleString("id-ID")}{" "}
                                {ri.ingredient.recipeUnit}
                              </td>
                              <td className="p-4 text-right text-muted-foreground">
                                {formatCurrency(ri.ingredient.averageCost)} /{" "}
                                {ri.ingredient.recipeUnit}
                              </td>
                              <td className="p-4 text-right font-bold text-primary">
                                {formatCurrency(costContribution)}
                              </td>
                              <td className="p-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleRemoveIngredient(ri.ingredientId)
                                  }
                                  className="h-7 w-7 text-red-600 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Add Ingredient Form Inline */}
              <Card className="border border-border/80 py-0 gap-0 rounded-xl shadow-sm bg-card/60 backdrop-blur-xs">
                <CardHeader className="p-4 border-b border-border/80 bg-muted/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-primary" /> Tambah Takaran
                    Bahan Baru
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form
                    onSubmit={handleAddIngredient}
                    className="flex flex-col sm:flex-row gap-4 items-end"
                  >
                    <div className="flex-1 w-full space-y-1">
                      <Label
                        htmlFor="ingredient-select"
                        className="text-[10px] font-bold"
                      >
                        Pilih Bahan Mentah
                      </Label>
                      <Select
                        value={selectedIngredientId}
                        onValueChange={setSelectedIngredientId}
                      >
                        <SelectTrigger className="h-10 border-border focus:ring-primary w-full text-xs">
                          <SelectValue placeholder="Pilih bahan baku..." />
                        </SelectTrigger>
                        <SelectContent className="border-border">
                          {availableIngredients.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Semua bahan terpakai.
                            </p>
                          ) : (
                            availableIngredients.map((ing: Ingredient) => (
                              <SelectItem
                                key={ing.id}
                                value={ing.id}
                                className="text-xs"
                              >
                                {ing.name} ({ing.recipeUnit})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-44 space-y-1">
                      <Label
                        htmlFor="ing-qty"
                        className="text-[10px] font-bold"
                      >
                        Takaran Resep
                      </Label>
                      <div className="relative">
                        <Input
                          id="ing-qty"
                          type="number"
                          required
                          min="0.0001"
                          step="any"
                          placeholder="Takaran"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="h-10 pr-12 border-border focus-visible:ring-primary text-xs"
                        />
                        {selectedIngredientUnit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                            {selectedIngredientUnit}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!selectedIngredientId || !quantity}
                      className="h-10 px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shrink-0 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Masukkan Bahan
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Dynamic HPP Calculator / Margin Analysis Summary */}
              {marginSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total HPP */}
                  <Card className="border border-border/80 py-0 bg-card/60 backdrop-blur-xs rounded-xl shadow-xs">
                    <CardContent className="p-4.5 space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Total HPP Menu
                        </span>
                        <Coins className="h-4 w-4 text-primary shrink-0" />
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(marginSummary.totalRecipeHpp)}
                      </p>
                      <span className="text-[9px] text-muted-foreground block leading-tight">
                        Akumulasi total biaya modal resep.
                      </span>
                    </CardContent>
                  </Card>

                  {/* Selling Price */}
                  <Card className="border border-border/80 py-0 bg-card/60 backdrop-blur-xs rounded-xl shadow-xs">
                    <CardContent className="p-4.5 space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Harga Jual POS
                        </span>
                        <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(marginSummary.sellingPrice)}
                      </p>
                      <span className="text-[9px] text-muted-foreground block leading-tight">
                        Tarif penjualan terdaftar di kasir.
                      </span>
                    </CardContent>
                  </Card>

                  {/* Gross Margin */}
                  <Card className="border border-border/80 py-0 bg-card/60 backdrop-blur-xs rounded-xl shadow-xs">
                    <CardContent className="p-4.5 space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          Margin Laba Kotor
                        </span>
                        <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-emerald-600">
                          {marginSummary.marginPct}%
                        </p>
                        <span className="text-xs text-muted-foreground font-semibold">
                          ({formatCurrency(marginSummary.profit)})
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground block leading-tight">
                        Est. rasio laba kotor per penjualan.
                      </span>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default RecipeContent;
