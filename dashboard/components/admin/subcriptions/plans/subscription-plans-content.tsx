"use client";

import React, { useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Store,
  Settings,
  Users,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import {
  useCreateSubscriptionPlans,
  useDeleteSubscriptionPlans,
  useSubscriptionPlans,
  useUpdateSubscriptionPlans,
  type SubcriptionPlan,
} from "@/hooks/useSubscriptionPlan";
import { SubcriptionPlansForm } from "./subcription-plans-form";
import { subscriptionPlanvalues } from "./schema";

export default function SubscriptionPlansContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubcriptionPlan | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const { data: plans, isLoading, isRefetching, refetch } = useSubscriptionPlans();
  const { mutateAsync: handleCreate, isPending: isCreateLoading } = useCreateSubscriptionPlans();
  const { mutateAsync: handleUpdate, isPending: isUpdateLoading } = useUpdateSubscriptionPlans();
  const { mutateAsync: handleDelete, isPending: isDeleteLoading } = useDeleteSubscriptionPlans();

  const handleOpenCreate = () => {
    setMode("create");
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (plan: SubcriptionPlan) => {
    setMode("edit");
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (plan: SubcriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (values: subscriptionPlanvalues) => {
    try {
      if (mode === "create") {
        await handleCreate(values);
      } else if (selectedPlan) {
        await handleUpdate({ id: selectedPlan.id, data: values });
      }
      setIsFormOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;
    try {
      await handleDelete(selectedPlan.id);
      setIsDeleteOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  const columns = useMemo<ColumnDef<SubcriptionPlan>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama Paket",
        cell: ({ row }) => {
          const plan = row.original;
          return (
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-md flex items-center justify-center border ${
                  plan.isActive
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{plan.name}</span>
                <code className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                  {plan.code}
                </code>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Harga",
        cell: ({ row }) => {
          const plan = row.original;
          const displayPrice = plan.promo > 0 ? plan.promo : plan.price;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {formatCurrency(displayPrice)}
              </span>
              {plan.promo > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(plan.price)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "durationDays",
        header: "Durasi",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.durationDays} hari</span>
        ),
      },
      {
        accessorKey: "features.maxOutlets",
        header: "Max Outlet",
        cell: ({ row }) => {
          const maxOutlets = row.original.features.maxOutlets;
          return (
            <div className="flex items-center gap-2">
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {maxOutlets === -1 ? "Unlimited" : maxOutlets}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "features.maxProducts",
        header: "Max Produk",
        cell: ({ row }) => {
          const maxProducts = row.original.features.maxProducts;
          return (
            <div className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {maxProducts === -1 ? "Unlimited" : maxProducts}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "features.maxStaff",
        header: "Max Staff",
        cell: ({ row }) => {
          const maxStaff = row.original.features.maxStaff;
          return (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {maxStaff === -1 ? "Unlimited" : maxStaff}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return (
            <Badge
              variant="outline"
              className={
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }
            >
              {isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Aktif
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" /> Nonaktif
                </>
              )}
            </Badge>
          );
        },
      },
      {
        accessorKey: "isPopular",
        header: "Populer",
        cell: ({ row }) => {
          const isPopular = row.original.isPopular;
          return isPopular ? (
            <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
              <Star className="h-3 w-3 mr-1 fill-amber-600" /> Popular
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "yearlyPrice",
        header: "Harga Yearly",
        cell: ({ row }) => {
          const plan = row.original;
          const effectivePrice = plan.yearlyPrice * (1 - plan.yearlyDiscount / 100);
          if (!plan.yearlyPrice || plan.yearlyPrice === 0) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {formatCurrency(effectivePrice)}
              </span>
              {plan.yearlyDiscount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(plan.yearlyPrice)}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                    -{plan.yearlyDiscount}%
                  </Badge>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const rowActions = (plan: SubcriptionPlan) => [
    {
      label: "Edit",
      icon: Edit3,
      onClick: () => handleOpenEdit(plan),
    },
    {
      label: "Hapus",
      icon: Trash2,
      variant: "destructive" as const,
      onClick: () => handleOpenDelete(plan),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Manajemen Paket Langganan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atur harga, durasi, dan batasan fitur untuk setiap paket langganan.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Buat Paket Baru
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={plans || []}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={refetch}
        tableId="subscription-plans-table"
        emptyMessage="Belum ada paket langganan. Buat paket baru untuk memulai."
        rowActions={rowActions}
        actionViewType="dropdown"
        pagination
        pageSize={10}
      />

      {/* Form Dialog */}
      <SubcriptionPlansForm
        mode={mode}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={isCreateLoading || isUpdateLoading}
        defaultValues={
          selectedPlan
            ? {
                id: selectedPlan.id,
                name: selectedPlan.name,
                code: selectedPlan.code,
                price: selectedPlan.price,
                promo: selectedPlan.promo,
                durationDays: selectedPlan.durationDays,
                isActive: selectedPlan.isActive,
                isPopular: selectedPlan.isPopular,
                features: {
                  maxOutlets: selectedPlan.features.maxOutlets,
                  maxProducts: selectedPlan.features.maxProducts,
                  maxStaff: selectedPlan.features.maxStaff,
                  canExportReport: selectedPlan.features.canExportReport,
                  supportLevel: selectedPlan.features.supportLevel,
                },
              }
            : undefined
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Paket Langganan"
        description={
          selectedPlan
            ? `Apakah Anda yakin ingin menghapus paket "${selectedPlan.name}"? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Hapus"
        confirmVariant="destructive"
        confirmLoading={isDeleteLoading}
        confirmLoadingLabel="Menghapus..."
        onConfirm={handleConfirmDelete}
        icon={<Trash2 className="h-6 w-6 text-destructive" />}
      />
    </div>
  );
}
