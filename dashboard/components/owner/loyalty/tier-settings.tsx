"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Trophy, Star, Crown, Gem } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus hex (#RRGGBB)")
    .default("#CD7F32"),
  minLifetimePoints: z.coerce.number().int().min(0, "Minimum 0 poin"),
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
  const queryClient = useQueryClient();
  const { data: tiers = [], isLoading } = useLoyaltyTiers(outletId);
  const { mutate: createTier } = useCreateLoyaltyTier();
  const { mutate: updateTier } = useUpdateLoyaltyTier();
  const { mutate: deleteTier } = useDeleteLoyaltyTier();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null);

  const tierFields: FormFieldConfig<TierFormValues>[] = [
    { name: "name", label: "Nama Tier", type: "text", placeholder: "Bronze, Silver, Gold...", colSpan: 1 },
    {
      name: "color",
      label: "Warna",
      type: "text",
      placeholder: "#CD7F32",
      description: "Kode warna hex, contoh: #FFD700 untuk Gold",
      colSpan: 1,
    },
    {
      name: "minLifetimePoints",
      label: "Minimum Lifetime Poin",
      type: "number",
      placeholder: "0",
      description: "Total poin yang pernah dikumpulkan (tidak berkurang saat redeem)",
      colSpan: 1,
    },
    {
      name: "earnMultiplier",
      label: "Multiplier Poin",
      type: "number",
      placeholder: "1.0",
      description: "Pengganda poin saat transaksi. 2.0 = 2x poin",
      colSpan: 1,
    },
    {
      name: "sortOrder",
      label: "Urutan Tier",
      type: "number",
      placeholder: "0",
      description: "Urutan dari terendah ke tertinggi (0 = paling rendah)",
      colSpan: 1,
    },
    {
      name: "benefits",
      label: "Keuntungan Tier",
      type: "textarea",
      placeholder: "Deskripsi keuntungan tier ini...",
      colSpan: 2,
    },
  ];

  const handleCreate = (values: TierFormValues) => {
    createTier(
      { outletId, data: { ...values, benefits: values.benefits ?? null } },
      {
        onSuccess: () => {
          toast.success("Tier berhasil dibuat.");
          setIsCreateOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message ?? "Gagal membuat tier.");
        },
      },
    );
  };

  const handleUpdate = (values: TierFormValues) => {
    if (!editingTier) return;
    updateTier(
      { outletId, tierId: editingTier.id, data: { ...values, benefits: values.benefits ?? null } },
      {
        onSuccess: () => {
          toast.success("Tier berhasil diperbarui.");
          setEditingTier(null);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message ?? "Gagal memperbarui tier.");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deletingTierId) return;
    deleteTier(
      { outletId, tierId: deletingTierId },
      {
        onSuccess: () => {
          toast.success("Tier berhasil dihapus.");
          setDeletingTierId(null);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message ?? "Gagal menghapus tier.");
        },
      },
    );
  };

  const columns: ColumnDef<LoyaltyTier>[] = [
    {
      accessorKey: "name",
      header: "Tier",
      cell: ({ row }) => {
        const Icon = tierIcons[row.index % tierIcons.length];
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: row.original.color + "20", color: row.original.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              {row.original.benefits && (
                <p className="text-xs text-muted-foreground line-clamp-1">{row.original.benefits}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "minLifetimePoints",
      header: "Min. Lifetime Poin",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          ≥ {row.original.minLifetimePoints.toLocaleString("id-ID")} poin
        </Badge>
      ),
    },
    {
      accessorKey: "earnMultiplier",
      header: "Multiplier",
      cell: ({ row }) => (
        <Badge
          className="font-mono"
          style={{
            backgroundColor: row.original.color + "20",
            color: row.original.color,
            borderColor: row.original.color + "40",
          }}
          variant="outline"
        >
          {row.original.earnMultiplier}×
        </Badge>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Urutan",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">#{row.original.sortOrder}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Info Panel */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Cara Kerja Tier</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            Tier dihitung berdasarkan <strong>Lifetime Poin</strong> — total poin yang pernah dikumpulkan, tidak
            berkurang saat poin ditukarkan.
          </li>
          <li>
            <strong>Multiplier</strong> diterapkan saat transaksi — tier Silver 2× berarti 2x lebih banyak poin per
            transaksi.
          </li>
          <li>Customer otomatis naik tier saat lifetime poin melewati threshold, tidak pernah turun.</li>
        </ul>
      </div>

      <DataTable
        columns={columns}
        data={tiers}
        title="Daftar Tier"
        emptyMessage="Belum ada tier. Buat tier pertama untuk program loyalti Anda."
        tableId="loyalty-tiers"
        isLoading={isLoading}
        titleActions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Tier
          </Button>
        }
        rowActions={(row) => [
          {
            label: "Edit",
            icon: Pencil,
            onClick: (row) => setEditingTier(row),
          },
          {
            label: "Hapus",
            icon: Trash2,
            variant: "destructive",
            onClick: (row) => setDeletingTierId(row.id),
          },
        ]}
        actionViewType="flex"
      />

      {/* Create Tier Dialog */}
      <ReusableForm
        schema={tierSchema}
        defaultValues={{
          name: "",
          color: "#CD7F32",
          minLifetimePoints: 0,
          earnMultiplier: 1.0,
          sortOrder: tiers.length,
          benefits: "",
        }}
        fields={tierFields}
        onSubmit={handleCreate}
        withDialog
        isDialogOpen={isCreateOpen}
        onDialogOpenChange={setIsCreateOpen}
        dialogTitle="Tambah Tier Baru"
        dialogDescription="Buat tier loyalti baru untuk outlet Anda."
        submitText="Buat Tier"
        gridCols={2}
      />

      {/* Edit Tier Dialog */}
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
          dialogTitle={`Edit Tier — ${editingTier.name}`}
          dialogDescription="Perbarui konfigurasi tier ini."
          submitText="Simpan Perubahan"
          gridCols={2}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingTierId}
        onOpenChange={(open) => !open && setDeletingTierId(null)}
        title="Hapus Tier?"
        description="Member yang berada di tier ini akan kehilangan tier mereka. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </div>
  );
}
