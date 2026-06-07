"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, parse } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Loader2, Plus, Edit, Trash2, MapPin, Eye, Camera, RefreshCcw, ExternalLink } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import { toast } from "sonner";

import { useManagerContext } from "@/app/manager/layout";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { AttendanceMapViewer } from "@/components/owner/attendance/AttendanceMapViewer";
import { attendanceApi, AttendanceRecord } from "@/lib/apis/attendance";
import { staffApi } from "@/lib/apis/staff";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Form schemas
const createManualSchema = z.object({
  staffId: z.string().min(1, "Staf wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib dipilih"),
  clockInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam masuk tidak valid (contoh: 08:30)"),
  clockOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam pulang tidak valid (contoh: 17:00)").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type CreateManualValues = z.infer<typeof createManualSchema>;

const editManualSchema = z.object({
  clockInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam masuk tidak valid (contoh: 08:30)"),
  clockOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam pulang tidak valid (contoh: 17:00)").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type EditManualValues = z.infer<typeof editManualSchema>;

export default function ManagerLaporanAbsensiPage() {
  const { outletData } = useManagerContext();
  const outletId = outletData?.id;
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [mapTarget, setMapTarget] = useState<{
    clockIn: { lat: number; lng: number } | null;
    clockOut: { lat: number; lng: number } | null;
    staffName: string;
  } | null>(null);

  const [photoViewer, setPhotoViewer] = useState<{ url: string; title: string } | null>(null);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Query staff members for dropdown filters and manual form
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", "list", outletId],
    queryFn: () => staffApi.listByOutlet(outletId!),
    enabled: !!outletId,
  });

  // Query attendance records
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["manager-attendance", outletId, startDate, endDate, staffFilter],
    queryFn: async () => {
      if (!outletId) return { data: [], total: 0 };
      return attendanceApi.listForOwner({
        outletId,
        startDate,
        endDate,
        staffId: staffFilter === "all" ? undefined : staffFilter,
        limit: 500,
      });
    },
    enabled: !!outletId,
    staleTime: 30_000,
  });

  const records = data?.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => attendanceApi.createManual(payload),
    onSuccess: () => {
      toast.success("Catatan absensi berhasil ditambahkan!");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-attendance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err?.message || "Gagal menyimpan data.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; payload: any }) => attendanceApi.updateManual(params.id, params.payload),
    onSuccess: () => {
      toast.success("Catatan absensi berhasil diperbarui!");
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ["manager-attendance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err?.message || "Gagal memperbarui data.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attendanceApi.deleteManual(id),
    onSuccess: () => {
      toast.success("Catatan absensi berhasil dihapus!");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["manager-attendance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err?.message || "Gagal menghapus data.");
    },
  });

  const handleAddSubmit = (values: CreateManualValues) => {
    if (!outletId) return;

    // Combine date and time to ISO Date string
    const clockInStr = `${values.date}T${values.clockInTime}:00`;
    const clockOutStr = values.clockOutTime ? `${values.date}T${values.clockOutTime}:00` : null;

    createMutation.mutate({
      outletId,
      staffId: values.staffId,
      date: new Date(values.date).toISOString(),
      clockIn: new Date(clockInStr).toISOString(),
      clockOut: clockOutStr ? new Date(clockOutStr).toISOString() : null,
      notes: values.notes,
    });
  };

  const handleEditSubmit = (values: EditManualValues) => {
    if (!editingRecord) return;

    const dateOnly = format(new Date(editingRecord.date), "yyyy-MM-dd");
    const clockInStr = `${dateOnly}T${values.clockInTime}:00`;
    const clockOutStr = values.clockOutTime ? `${dateOnly}T${values.clockOutTime}:00` : null;

    updateMutation.mutate({
      id: editingRecord.id,
      payload: {
        clockIn: new Date(clockInStr).toISOString(),
        clockOut: clockOutStr ? new Date(clockOutStr).toISOString() : null,
        notes: values.notes,
      },
    });
  };

  // ReusableForm configurations
  const addFields: FormFieldConfig<CreateManualValues>[] = [
    {
      name: "staffId",
      label: "Pilih Staf",
      type: "select",
      placeholder: "Pilih nama staf...",
      options: staffList.map((s) => ({ label: s.name, value: s.id })),
    },
    {
      name: "date",
      label: "Tanggal Kehadiran",
      type: "date",
    },
    {
      name: "clockInTime",
      label: "Jam Masuk (Format HH:MM)",
      type: "text",
      placeholder: "Contoh: 08:00",
    },
    {
      name: "clockOutTime",
      label: "Jam Pulang (Format HH:MM - Opsional)",
      type: "text",
      placeholder: "Contoh: 17:00",
    },
    {
      name: "notes",
      label: "Catatan Koreksi / Alasan",
      type: "textarea",
      placeholder: "Masukkan alasan koreksi manual...",
    },
  ];

  const editFields: FormFieldConfig<EditManualValues>[] = [
    {
      name: "clockInTime",
      label: "Jam Masuk (Format HH:MM)",
      type: "text",
      placeholder: "Contoh: 08:00",
    },
    {
      name: "clockOutTime",
      label: "Jam Pulang (Format HH:MM - Opsional)",
      type: "text",
      placeholder: "Contoh: 17:00",
    },
    {
      name: "notes",
      label: "Catatan Koreksi / Alasan",
      type: "textarea",
      placeholder: "Masukkan alasan koreksi manual...",
    },
  ];

  const editDefaultValues = useMemo(() => {
    if (!editingRecord) return { clockInTime: "", clockOutTime: "", notes: "" };
    
    return {
      clockInTime: format(new Date(editingRecord.clockIn), "HH:mm"),
      clockOutTime: editingRecord.clockOut ? format(new Date(editingRecord.clockOut), "HH:mm") : "",
      notes: editingRecord.notes || "",
    };
  }, [editingRecord]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Laporan & Kelola Absensi"
        description="Pantau, audit wajah, dan kelola kehadiran staf di outlet Anda."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            {outletId && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5"
                onClick={() => window.open(`/attendance/portal?outletId=${outletId}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Buka Portal Absensi</span>
              </Button>
            )}
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Tambah Absen Manual</span>
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
        <span className="text-xs font-semibold text-muted-foreground">Filter Staf:</span>
        <select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          className="text-xs font-medium bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Semua Karyawan</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={records}
        emptyMessage="Belum ada catatan absensi karyawan untuk filter ini."
        columns={[
          {
            accessorKey: "date",
            header: "Tanggal",
            cell: ({ row }) => (
              <span className="text-xs font-bold tabular-nums">
                {format(new Date(row.original.date), "dd MMM yyyy", { locale: localeId })}
              </span>
            ),
          },
          {
            accessorKey: "staff",
            header: "Karyawan",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{row.original.staff?.name ?? "-"}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{row.original.staff?.username ? `@${row.original.staff.username.split("@")[0]}` : "-"}</span>
              </div>
            ),
          },
          {
            accessorKey: "clockIn",
            header: "Masuk",
            cell: ({ row }) => (
              <span className="text-xs tabular-nums font-medium">
                {format(new Date(row.original.clockIn), "HH:mm", { locale: localeId })}
              </span>
            ),
          },
          {
            accessorKey: "clockInFaceUrl",
            header: "Foto Masuk",
            cell: ({ row }) =>
              row.original.clockInFaceUrl ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted shadow-sm hover:opacity-85 transition-opacity">
                  <img
                    src={row.original.clockInFaceUrl}
                    alt="Selfie Masuk"
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() =>
                      setPhotoViewer({
                        url: row.original.clockInFaceUrl!,
                        title: `Foto Selfie Masuk - ${row.original.staff?.name}`,
                      })
                    }
                  />
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">–</span>
              ),
          },
          {
            accessorKey: "clockOut",
            header: "Pulang",
            cell: ({ row }) =>
              row.original.clockOut ? (
                <span className="text-xs tabular-nums font-medium">
                  {format(new Date(row.original.clockOut), "HH:mm", { locale: localeId })}
                </span>
              ) : (
                <Badge variant="outline" className="text-[9px] font-bold text-amber-600 border-amber-200 bg-amber-50/20">
                  Belum Absen
                </Badge>
              ),
          },
          {
            accessorKey: "clockOutFaceUrl",
            header: "Foto Pulang",
            cell: ({ row }) =>
              row.original.clockOutFaceUrl ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted shadow-sm hover:opacity-85 transition-opacity">
                  <img
                    src={row.original.clockOutFaceUrl}
                    alt="Selfie Pulang"
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() =>
                      setPhotoViewer({
                        url: row.original.clockOutFaceUrl!,
                        title: `Foto Selfie Pulang - ${row.original.staff?.name}`,
                      })
                    }
                  />
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">–</span>
              ),
          },
          {
            accessorKey: "duration",
            header: "Durasi Kerja",
            cell: ({ row }) => {
              if (!row.original.clockOut) return <span className="text-xs text-muted-foreground">–</span>;
              const diff = new Date(row.original.clockOut).getTime() - new Date(row.original.clockIn).getTime();
              const hours = Math.floor(diff / 3600000);
              const minutes = Math.floor((diff % 3600000) / 60000);
              return (
                <span className="text-xs font-bold tabular-nums">
                  {hours}h {minutes}m
                </span>
              );
            },
          },
          {
            accessorKey: "clockInLat",
            header: "Lokasi GPS",
            cell: ({ row }) => {
              const hasIn = row.original.clockInLat != null;
              const hasOut = row.original.clockOutLat != null;
              if (!hasIn && !hasOut) return <span className="text-xs text-muted-foreground">–</span>;
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1.5 py-1 text-[10px] font-mono gap-1"
                  onClick={() =>
                    setMapTarget({
                      clockIn: hasIn
                        ? { lat: row.original.clockInLat!, lng: row.original.clockInLng! }
                        : null,
                      clockOut: hasOut
                        ? { lat: row.original.clockOutLat!, lng: row.original.clockOutLng! }
                        : null,
                      staffName: row.original.staff?.name ?? "-",
                    })
                  }
                >
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  <span>Lihat Peta</span>
                </Button>
              );
            },
          },
          {
            accessorKey: "notes",
            header: "Keterangan",
            cell: ({ row }) => (
              <span className="text-[11px] text-muted-foreground max-w-[120px] truncate block" title={row.original.notes || ""}>
                {row.original.notes || "-"}
              </span>
            ),
          },
        ]}
        rowActions={(row) => [
          {
            label: "Edit",
            icon: Edit,
            onClick: (r) => setEditingRecord(r),
          },
          {
            label: "Hapus",
            icon: Trash2,
            variant: "destructive",
            onClick: (r) => setDeletingId(r.id),
          },
        ]}
        actionViewType="flex"
      />

      {/* Map modal */}
      <AttendanceMapViewer
        open={!!mapTarget}
        onOpenChange={(o) => !o && setMapTarget(null)}
        clockIn={mapTarget?.clockIn ?? null}
        clockOut={mapTarget?.clockOut ?? null}
        staffName={mapTarget?.staffName}
      />

      {/* Photo Viewer Modal */}
      <Dialog open={!!photoViewer} onOpenChange={(o) => !o && setPhotoViewer(null)}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{photoViewer?.title}</DialogTitle>
            <DialogDescription className="text-xs">Foto bukti absensi staf</DialogDescription>
          </DialogHeader>
          <div className="relative overflow-hidden border rounded-lg mt-3 bg-black flex items-center justify-center aspect-square shadow-md">
            {photoViewer?.url ? (
              <img
                src={photoViewer.url}
                alt="Attendance selfie"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" onClick={() => setPhotoViewer(null)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Manual Attendance Form Dialog */}
      <ReusableForm
        schema={createManualSchema}
        fields={addFields}
        defaultValues={{
          staffId: "",
          date: format(new Date(), "yyyy-MM-dd"),
          clockInTime: "08:00",
          clockOutTime: "",
          notes: "",
        }}
        onSubmit={handleAddSubmit}
        withDialog
        isDialogOpen={isAddOpen}
        onDialogOpenChange={setIsAddOpen}
        dialogTitle="Tambah Kehadiran Manual"
        dialogDescription="Buat log absensi baru secara manual untuk karyawan yang lupa melakukan absen."
        submitText="Tambah Absensi"
        cancelText="Batal"
        isLoading={createMutation.isPending}
      />

      {/* Edit Manual Attendance Form Dialog */}
      {editingRecord && (
        <ReusableForm
          schema={editManualSchema}
          fields={editFields}
          defaultValues={editDefaultValues}
          onSubmit={handleEditSubmit}
          withDialog
          isDialogOpen={!!editingRecord}
          onDialogOpenChange={(o) => !o && setEditingRecord(null)}
          dialogTitle={`Koreksi Absensi - ${editingRecord.staff?.name}`}
          dialogDescription={`Koreksi jam masuk/pulang staf untuk tanggal ${format(new Date(editingRecord.date), "dd MMMM yyyy", { locale: localeId })}.`}
          submitText="Simpan Koreksi"
          cancelText="Batal"
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Hapus Catatan Absensi"
        description="Apakah Anda yakin ingin menghapus catatan absensi ini? Data yang dihapus tidak dapat dipulihkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onConfirm={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
        confirmLoading={deleteMutation.isPending}
      />
    </div>
  );
}
