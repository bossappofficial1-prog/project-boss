"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useOutletContext } from "@/components/providers/OutletProvider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { staffApi } from "@/lib/api";
import type { StaffMember } from "@/types/staff";
import { StaffDialog } from "@/components/features/owner/staff/StaffModal";
import { StaffTable } from "@/components/features/owner/staff/StaffTable";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

export default function StaffManagementPage() {
  const { selectedOutlet } = useOutletContext();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const router = useRouter();
  const [, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const outletName = useMemo(
    () => selectedOutlet?.name ?? "Outlet tidak dipilih",
    [selectedOutlet?.name],
  );

  const loadStaff = useCallback(async () => {
    if (!selectedOutlet?.id) {
      setStaff([]);
      return;
    }

    try {
      setIsLoading(true);
      const results = await staffApi.listByOutlet(selectedOutlet.id);
      setStaff(results);
    } catch (error) {
      console.error("Failed to load staff list", error);
      toast.error((error as Error).message ?? "Gagal memuat data staff");
    } finally {
      setIsLoading(false);
    }
  }, [selectedOutlet?.id]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const resetForm = () => {
    setEditingStaff(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setModalMode("edit");
    setEditingStaff(member);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload: any) => {
    if (!selectedOutlet?.id) return;

    try {
      setIsSubmitting(true);

      const finalPayload = {
        ...payload,
        username: payload.username ? `${payload.username}` : payload.username,
      };

      if (modalMode === "create") {
        await staffApi.create({
          ...finalPayload,
          outletId: selectedOutlet.id,
        });
        toast.success("Staff berhasil ditambahkan");
      } else if (editingStaff) {
        await staffApi.update(editingStaff.id, finalPayload);
        toast.success("Data staff berhasil diperbarui");
      }

      setIsModalOpen(false);
      resetForm();
      await loadStaff();
    } catch (error) {
      console.error("Failed to submit staff form", error);
      toast.error((error as Error).message ?? "Gagal menyimpan data staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) {
      return false;
    }

    try {
      setIsDeleting(true);
      await staffApi.delete(deletingStaff.id);
      toast.success("Staff berhasil dihapus");
      setDeletingStaff(null);
      await loadStaff();
      return true;
    } catch (error) {
      console.error("Failed to delete staff", error);
      toast.error((error as Error).message ?? "Gagal menghapus staff");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const activeStaffCount = useMemo(
    () => staff.filter((s) => s.status === "ACTIVE").length,
    [staff],
  );
  const inactiveStaffCount = useMemo(
    () => staff.filter((s) => s.status === "INACTIVE").length,
    [staff],
  );

  if (!selectedOutlet)
    return (
      <EmptyOutletState onAddOutlet={() => router.push("/owner#add-outlet")} />
    );

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <SectionHeader
        title="Kelola Kasir"
        description={`Atur petugas kasir untuk ${outletName}. Kelola akses masuk mereka ke sistem Point of Sale (POS).`}
        actions={
          <Button type="button" onClick={handleOpenCreate}>
            <UserPlus className="h-4 w-4" /> Tambah Kasir Baru
          </Button>
        }
      />

      {/* Solid Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Kasir Terdaftar",
            value: staff.length,
            icon: Users,
            color: "text-muted-foreground",
            bg: "bg-muted",
            border: "border-border/50",
          },
          {
            label: "Kasir Aktif",
            value: activeStaffCount,
            icon: UserPlus,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
            border: "border-border/50",
          },
          {
            label: "Kasir Nonaktif",
            value: inactiveStaffCount,
            icon: Users,
            color: "text-destructive",
            bg: "bg-destructive/10",
            border: "border-border/50",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border bg-card shadow-none",
              stat.border,
            )}
          >
            <div
              className={cn(
                "h-11 w-11 rounded-lg flex items-center justify-center shrink-0",
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {stat.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  petugas
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <StaffTable
        data={staff}
        onDelete={(member) => {
          setDeletingStaff(member);
          setIsDeleteDialogOpen(true);
        }}
        onEdit={(member) => {
          handleOpenEdit(member);
        }}
      />

      <StaffDialog
        onSubmit={handleSubmit}
        initialData={editingStaff as any}
        isOpen={isModalOpen}
        onOpenChange={(open) => !isSubmitting && setIsModalOpen(open)}
        modalMode={modalMode}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingStaff(null);
          }
          setIsDeleteDialogOpen(open);
        }}
        title="Hapus Akun Kasir?"
        description={
          deletingStaff
            ? `Apakah Anda yakin ingin menghapus akses kasir ${deletingStaff.name}? Kasir ini tidak akan bisa login lagi ke sistem POS.`
            : undefined
        }
        confirmLabel="Hapus Akses"
        confirmVariant="destructive"
        confirmLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
