"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Gift, Tag, Percent, Package, Banknote, Ticket } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { DataTable } from "@/components/ui/data-table";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import {
  useLoyaltyRewards,
  useCreateLoyaltyReward,
  useUpdateLoyaltyReward,
  useDeleteLoyaltyReward,
} from "@/hooks/api/use-loyalty";
import { useProducts } from "@/hooks/use-products";
import type { LoyaltyReward, LoyaltyRewardType } from "@/lib/apis/loyalty";

const rewardTypeLabels: Record<LoyaltyRewardType, { label: string; icon: React.ElementType; color: string }> = {
  DISCOUNT_FLAT: { label: "Diskon Flat", icon: Tag, color: "text-emerald-500" },
  DISCOUNT_PERCENT: { label: "Diskon %", icon: Percent, color: "text-blue-500" },
  FREE_ITEM: { label: "Produk Gratis", icon: Package, color: "text-purple-500" },
  VOUCHER: { label: "Voucher", icon: Ticket, color: "text-orange-500" },
  CASHBACK: { label: "Cashback", icon: Banknote, color: "text-cyan-500" },
};

const rewardSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["DISCOUNT_FLAT", "DISCOUNT_PERCENT", "FREE_ITEM", "VOUCHER", "CASHBACK"]),
  pointsCost: z.coerce.number().int().min(1, "Minimum 1 poin"),
  discountAmount: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  voucherValue: z.coerce.number().min(0).optional(),
  cashbackAmount: z.coerce.number().min(0).optional(),
  productId: z.string().optional(),
  stock: z.coerce.number().int().min(-1).default(-1),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

interface RewardCatalogProps {
  outletId: string;
}

export function RewardCatalog({ outletId }: RewardCatalogProps) {
  const [includeInactive, setIncludeInactive] = useState(false);
  const { data: rewards = [], isLoading } = useLoyaltyRewards(outletId, includeInactive);
  const { data: productsData } = useProducts(outletId, { limit: 1000 });
  const products = Array.isArray(productsData) ? productsData : productsData?.products ?? [];
  const productOptions = products.filter((p: any) => p.status === "ACTIVE").map((p: any) => ({ label: p.name, value: p.id }));
  const { mutate: createReward, isPending: isCreating } = useCreateLoyaltyReward();
  const { mutate: updateReward, isPending: isUpdating } = useUpdateLoyaltyReward();
  const { mutate: deleteReward } = useDeleteLoyaltyReward();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [deletingRewardId, setDeletingRewardId] = useState<string | null>(null);

  const rewardFields: FormFieldConfig<RewardFormValues>[] = [
    { name: "name", label: "Nama Reward", type: "text", placeholder: "Diskon 10rb...", colSpan: 2 },
    { name: "type", label: "Tipe", type: "select", options: Object.entries(rewardTypeLabels).map(([v, { label }]) => ({ label, value: v })), colSpan: 1 },
    { name: "pointsCost", label: "Biaya Poin", type: "number", placeholder: "100", colSpan: 1 },
    { name: "discountAmount", label: "Diskon (Rp)", type: "currency", placeholder: "10000", colSpan: 1, condition: (v) => v.type === "DISCOUNT_FLAT" },
    { name: "discountPercent", label: "Diskon (%)", type: "number", placeholder: "10", colSpan: 1, condition: (v) => v.type === "DISCOUNT_PERCENT" },
    { name: "maxDiscount", label: "Maks. Diskon (Rp)", type: "currency", placeholder: "50000", colSpan: 1, condition: (v) => v.type === "DISCOUNT_PERCENT" },
    { name: "voucherValue", label: "Voucher (Rp)", type: "currency", placeholder: "50000", colSpan: 1, condition: (v) => v.type === "VOUCHER" },
    { name: "cashbackAmount", label: "Cashback (Rp)", type: "currency", placeholder: "20000", colSpan: 1, condition: (v) => v.type === "CASHBACK" },
    { name: "productId", label: "Produk", type: "select", options: productOptions, colSpan: 1, condition: (v) => v.type === "FREE_ITEM" },
    { name: "stock", label: "Stok", type: "number", placeholder: "-1", colSpan: 1 },
    { name: "isActive", label: "Status", type: "dual-option-switch", switchOptions: { left: { label: "Nonaktif", value: false }, right: { label: "Aktif", value: true } }, colSpan: 1 },
    { name: "validFrom", label: "Berlaku Dari", type: "date", colSpan: 1 },
    { name: "validUntil", label: "Berlaku Sampai", type: "date", colSpan: 1 },
    { name: "description", label: "Deskripsi", type: "textarea", placeholder: "Deskripsi reward...", colSpan: 2 },
  ];

  const handleCreate = (values: RewardFormValues) => {
    createReward(
      { outletId, data: values as any },
      {
        onSuccess: () => { gooeyToast.success("Reward berhasil dibuat."); setIsCreateOpen(false); },
        onError: (err: any) => gooeyToast.error(err.response?.data?.message ?? "Gagal membuat reward."),
      }
    );
  };

  const handleUpdate = (values: RewardFormValues) => {
    if (!editingReward) return;
    updateReward(
      { outletId, rewardId: editingReward.id, data: values as any },
      {
        onSuccess: () => { gooeyToast.success("Reward berhasil diperbarui."); setEditingReward(null); },
        onError: (err: any) => gooeyToast.error(err.response?.data?.message ?? "Gagal memperbarui reward."),
      }
    );
  };

  const handleDelete = () => {
    if (!deletingRewardId) return;
    deleteReward(
      { outletId, rewardId: deletingRewardId },
      {
        onSuccess: () => { gooeyToast.success("Reward berhasil dihapus."); setDeletingRewardId(null); },
        onError: (err: any) => gooeyToast.error(err.response?.data?.message ?? "Gagal menghapus reward."),
      }
    );
  };

  const columns: ColumnDef<LoyaltyReward>[] = [
    {
      accessorKey: "name",
      header: "Reward",
      cell: ({ row }) => {
        const { icon: Icon, color, label } = rewardTypeLabels[row.original.type];
        return (
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md bg-muted ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{row.original.name}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "pointsCost",
      header: "Poin",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          <Gift className="h-3 w-3 mr-1" />
          {row.original.pointsCost.toLocaleString("id-ID")}
        </Badge>
      ),
    },
    {
      accessorKey: "type",
      header: "Nilai",
      cell: ({ row }) => {
        const r = row.original;
        let value = "";
        if (r.type === "DISCOUNT_FLAT") value = `Rp ${r.discountAmount?.toLocaleString("id-ID")}`;
        else if (r.type === "DISCOUNT_PERCENT") value = `${r.discountPercent}%${r.maxDiscount ? ` (maks ${r.maxDiscount?.toLocaleString("id-ID")})` : ""}`;
        else if (r.type === "VOUCHER") value = `Rp ${r.voucherValue?.toLocaleString("id-ID")}`;
        else if (r.type === "CASHBACK") value = `Rp ${r.cashbackAmount?.toLocaleString("id-ID")}`;
        else value = "Produk gratis";
        return <span className="text-xs font-medium">{value}</span>;
      },
    },
    {
      accessorKey: "stock",
      header: "Stok",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.stock === -1 ? "Unlimited" : `${row.original.stock}`}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-[10px]">
          {row.original.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
  ];

  const defaultFormValues: RewardFormValues = {
    name: "", type: "DISCOUNT_FLAT", pointsCost: 100, discountAmount: undefined,
    discountPercent: undefined, maxDiscount: undefined, voucherValue: undefined,
    cashbackAmount: undefined, productId: undefined, stock: -1, isActive: true,
    description: "", validFrom: undefined, validUntil: undefined,
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={rewards}
        title="Katalog Reward"
        emptyMessage="Belum ada reward. Buat reward pertama Anda."
        tableId="loyalty-rewards"
        isLoading={isLoading}
        titleActions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="include-inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
              <Label htmlFor="include-inactive" className="text-xs text-muted-foreground cursor-pointer">
                Tampilkan nonaktif
              </Label>
            </div>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Tambah Reward
            </Button>
          </div>
        }
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: (r) => setEditingReward(r) },
          { label: "Hapus", icon: Trash2, variant: "destructive", onClick: (r) => setDeletingRewardId(r.id) },
        ]}
        actionViewType="dropdown"
      />

      <ReusableForm
        schema={rewardSchema}
        defaultValues={defaultFormValues}
        fields={rewardFields}
        onSubmit={handleCreate}
        withDialog
        isDialogOpen={isCreateOpen}
        onDialogOpenChange={setIsCreateOpen}
        dialogTitle="Tambah Reward"
        dialogDescription="Buat reward yang bisa ditukarkan member."
        submitText="Buat Reward"
        isLoading={isCreating}
        gridCols={2}
      />

      {editingReward && (
        <ReusableForm
          schema={rewardSchema}
          defaultValues={{
            name: editingReward.name, type: editingReward.type, pointsCost: editingReward.pointsCost,
            discountAmount: editingReward.discountAmount ?? undefined, discountPercent: editingReward.discountPercent ?? undefined,
            maxDiscount: editingReward.maxDiscount ?? undefined, voucherValue: editingReward.voucherValue ?? undefined,
            cashbackAmount: editingReward.cashbackAmount ?? undefined, productId: editingReward.productId ?? undefined,
            stock: editingReward.stock, isActive: editingReward.isActive, description: editingReward.description ?? "",
            validFrom: editingReward.validFrom?.slice(0, 10), validUntil: editingReward.validUntil?.slice(0, 10),
          }}
          fields={rewardFields}
          onSubmit={handleUpdate}
          withDialog
          isDialogOpen={!!editingReward}
          onDialogOpenChange={(open) => !open && setEditingReward(null)}
          dialogTitle={`Edit — ${editingReward.name}`}
          submitText="Simpan"
          isLoading={isUpdating}
          gridCols={2}
        />
      )}

      <ConfirmDialog
        open={!!deletingRewardId}
        onOpenChange={(open) => !open && setDeletingRewardId(null)}
        title="Hapus Reward?"
        description="Reward yang sudah ditukar tetap ada di riwayat, tapi tidak bisa ditukar lagi."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </div>
  );
}
