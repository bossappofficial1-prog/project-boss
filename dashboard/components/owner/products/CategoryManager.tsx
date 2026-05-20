"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

import { productCategoryApi, type ProductCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CategoryManager({ outletId }: { outletId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [name, setName] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["product-categories", outletId],
    queryFn: () => productCategoryApi.listByOutlet(outletId),
    enabled: !!outletId,
    staleTime: 5 * 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; outletId: string }) =>
      productCategoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories", outletId] });
      toast.success("Kategori berhasil ditambahkan");
      setDialogOpen(false);
      setName("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menambahkan kategori");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      productCategoryApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories", outletId] });
      toast.success("Kategori berhasil diubah");
      setDialogOpen(false);
      setEditing(null);
      setName("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mengubah kategori");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productCategoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories", outletId] });
      toast.success("Kategori berhasil dihapus");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menghapus kategori");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (cat: ProductCategory) => {
    setEditing(cat);
    setName(cat.name);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, name: name.trim() });
    } else {
      createMutation.mutate({ name: name.trim(), outletId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} kategori tersedia
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Kategori
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40 bg-muted/20"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {cat._count?.products ?? 0} produk
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(cat)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && categories.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Belum ada kategori. Klik "Tambah Kategori" untuk membuat.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Kategori" : "Tambah Kategori"}</DialogTitle>
            <DialogDescription>
              {editing ? "Ubah nama kategori produk" : "Buat kategori baru untuk produk"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input
                id="cat-name"
                placeholder="Contoh: Makanan, Minuman, Snack"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                {editing ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Kategori"
        description={`Yakin ingin menghapus kategori "${deleteTarget?.name}"? Produk dalam kategori ini tidak akan terhapus.`}
        confirmText="Hapus"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
