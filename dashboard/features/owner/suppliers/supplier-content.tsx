"use client";

import React, { useState, useMemo } from "react";
import { gooeyToast } from "goey-toast";
import {
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  MapPin,
  Package,
  Trash2,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import { useOutletStore } from "@/stores/outlet.store";
import { useSuppliers, useDeleteSupplier } from "@/hooks/api/use-suppliers";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupplierFormDialog } from "./supplier-form-dialog";
import type { Supplier } from "@/lib/apis/supplier";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";

export function SupplierContent() {
  const { selectedOutletId, isLoading: outletLoading } = useOutletStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const deleteMutation = useDeleteSupplier();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useSuppliers(
    selectedOutletId!,
    debouncedSearch || undefined,
  );
  const suppliers = data?.suppliers ?? [];

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      gooeyToast.success(`Supplier "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
    } catch (error: any) {
      gooeyToast.error(error?.response?.data?.message || "Gagal menghapus supplier");
    }
  };

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Manajemen Supplier"
        description="Kelola data supplier dan hubungkan dengan produk untuk mempermudah restok."
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Tambah Supplier
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Supplier List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground/70">
              {debouncedSearch
                ? "Supplier tidak ditemukan"
                : "Belum ada supplier"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              {debouncedSearch
                ? "Coba kata kunci lain"
                : "Tambahkan supplier untuk mempermudah pencatatan pembelian stok."}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={handleAdd}
                variant="outline"
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Supplier Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="group py-0 rounded-md border-border/80 bg-background shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {supplier.name}
                      </p>
                      {supplier._count?.products !== undefined && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-bold mt-0.5"
                        >
                          {supplier._count.products} produk
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(supplier)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5">
                  {supplier.phone && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{supplier.phone}</span>
                    </p>
                  )}
                  {supplier.email && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </p>
                  )}
                  {supplier.address && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </p>
                  )}
                </div>

                {/* Products */}
                {supplier.products && supplier.products.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                    {supplier.products.slice(0, 3).map((sp) => (
                      <Badge
                        key={sp.id}
                        variant="outline"
                        className="text-[9px] font-medium gap-1 px-1.5 py-0.5"
                      >
                        <Package className="h-2.5 w-2.5" />
                        {sp.productGoods.product.name}
                      </Badge>
                    ))}
                    {supplier.products.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-medium px-1.5 py-0.5"
                      >
                        +{supplier.products.length - 3} lainnya
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editingSupplier}
        outletId={selectedOutletId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Supplier"
        description={`Apakah Anda yakin ingin menghapus supplier "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
