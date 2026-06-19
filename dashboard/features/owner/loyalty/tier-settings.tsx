"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Trophy, Star, Crown, Gem, Info } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { DataTable } from "@/components/ui/data-table";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import {
  useLoyaltyTiers,
  useCreateLoyaltyTier,
  useUpdateLoyaltyTier,
  useDeleteLoyaltyTier,
} from "@/hooks/api/use-loyalty";
import type { LoyaltyTier } from "@/lib/apis/loyalty";

const tierSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format hex (#RRGGBB)")
    .default("#CD7F32"),
  minLifetimePoints: z.coerce.number().int().min(0),
  earnMultiplier: z.coerce.number().min(0.1).max(10),
  sortOrder: z.coerce.number().int().min(0),
  benefits: z.string().max(500).nullable().optional(),
});

type TierFormValues = z.infer<typeof tierSchema>;

const tierIcons = [Trophy, Star, Crown, Gem];

interface TierSettingsProps {
  outletId: string;
}

export function TierSettings({ outletId }: TierSettingsProps) {
  const { data: tiers = [], isLoading } = useLoyaltyTiers(outletId);
  const { mutate: createTier } = useCreateLoyaltyTier();
  const { mutate: updateTier } = useUpdateLoyaltyTier();
  const { mutate: deleteTier } = useDeleteLoyaltyTier();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null);

  const tierFields: FormFieldConfig<TierFormValues>[] = [
    { name: "name", label: "Nama Tier", type: "text", placeholder: "Bronze, Silver, Gold...", colSpan: 1 },
    { name: "color", label: "Warna", type: "text", placeholder: "#CD7F32", colSpan: 1 },
    { name: "minLifetimePoints", label: "Min. Lifetime Poin", type: "number", placeholder: "0", colSpan: 1 },
    { name: "earnMultiplier", label: "Multiplier", type: "number", placeholder: "1.0", colSpan: 1 },
    { name: "sortOrder", label: "Urutan", type: "number", placeholder: "0", colSpan: 1 },
    { name: "benefits", label: "Keuntungan", type: "textarea", placeholder: "Deskripsi keuntungan tier...", colSpan: 2 },
  ];

  const handleCreate = (values: TierFormValues) => {
    createTier(
      { outletId, data: { ...values, benefits: values.benefits ?? null } },
      {
        onSuccess: () => {
          gooeyToast.success("Tier berhasil dibuat.");
          setIsCreateOpen(false);
        },
        onError: (err: any) => gooeyToast.error(err.response?.data?.message ?? "Gagal membuat tier."),
      }
    );
  };

  const handleUpdate = (values: TierFormValues) => {
    if (!editingTier) return;
    updateTier(
      { outletId, tierId: editingTier.id, data: { ...values, benefits: values.benefits ?? null } },
      {
        onSuccess: () => {
          gooeyToast.success("Tier berhasil diperbarui.");
          setEditingTier(null);
        },
        onError: (err: any) => gooeyToast.error(err.response?.data?.message ?? "Gagal memperbarui tier."),
      }
    );
  };

  const handleDelete = () => {
    if (!deletingTierId) return;
    deleteTier(
      { outletId, tierId: deletingTierId },
      {
        onSuccess: () => {
          gooeyToast.success("Tier berhasil dihapus.");
          setDeletingTierId(null);
        },
        onError: (err: any) => gooeyToast.error(err.response?.data?.message ?? "Gagal menghapus tier."),
      }
    );
  };

  const columns: ColumnDef<LoyaltyTier>[] = [
    {
      accessorKey: "name",
      header: "Tier",
      cell: ({ row }) => {
        const Icon = tierIcons[row.index % tierIcons.length];
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: row.original.color + "20", color: row.original.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{row.original.name}</p>
              {row.original.benefits && (
                <p className="text-[10px] text-muted-foreground line-clamp-1">{row.original.benefits}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "minLifetimePoints",
      header: "Min. Poin",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.minLifetimePoints.toLocaleString("id-ID")}
        </Badge>
      ),
    },
    {
      accessorKey: "earnMultiplier",
      header: "Multiplier",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="font-mono text-xs"
          style={{
            backgroundColor: row.original.color + "20",
            color: row.original.color,
            borderColor: row.original.color + "40",
          }}
        >
          {row.original.earnMultiplier}x
        </Badge>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Urutan",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">#{row.original.sortOrder}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <div className="space-y-1">
          <p>
            Tier dihitung dari <strong>Lifetime Poin</strong> (tidak berkurang saat redeem).
            Multiplier diterapkan saat transaksi (Silver 2x = 2x poin).
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tiers}
        title="Daftar Tier"
        emptyMessage="Belum ada tier. Buat tier pertama Anda."
        tableId="loyalty-tiers"
        isLoading={isLoading}
        titleActions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Tier
          </Button>
        }
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: (r) => setEditingTier(r) },
          { label: "Hapus", icon: Trash2, variant: "destructive", onClick: (r) => setDeletingTierId(r.id) },
        ]}
        actionViewType="flex"
      />

      {/* Create */}
      <ReusableForm
        schema={tierSchema}
        defaultValues={{ name: "", color: "#CD7F32", minLifetimePoints: 0, earnMultiplier: 1.0, sortOrder: tiers.length, benefits: "" }}
        fields={tierFields}
        onSubmit={handleCreate}
        withDialog
        isDialogOpen={isCreateOpen}
        onDialogOpenChange={setIsCreateOpen}
        dialogTitle="Tambah Tier Baru"
        dialogDescription="Buat tier loyalti baru."
        submitText="Buat Tier"
        gridCols={2}
      />

      {/* Edit */}
      {editingTier && (
        <ReusableForm
          schema={tierSchema}
          defaultValues={{
            name: editingTier.name,
            color: editingTier.color,
            minLifetimePoints: editingTier.minLifetimePoints,
            earnMultiplier: editingTier.earnMultiplier,
            sortOrder: editingTier.sortOrder,
            benefits: editingTier.benefits ?? "",
          }}
          fields={tierFields}
          onSubmit={handleUpdate}
          withDialog
          isDialogOpen={!!editingTier}
          onDialogOpenChange={(open) => !open && setEditingTier(null)}
          dialogTitle={`Edit — ${editingTier.name}`}
          dialogDescription="Perbarui konfigurasi tier."
          submitText="Simpan"
          gridCols={2}
        />
      )}

      {/* Delete */}
      <ConfirmDialog
        open={!!deletingTierId}
        onOpenChange={(open) => !open && setDeletingTierId(null)}
        title="Hapus Tier?"
        description="Member di tier ini akan kehilangan tier mereka."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </div>
  );
}
