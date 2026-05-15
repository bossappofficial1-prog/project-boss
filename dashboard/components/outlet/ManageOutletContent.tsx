"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  MapPin,
  Phone,
  Clock,
  Store,
  Pencil,
  QrCode,
  Globe,
  Zap,
  ArrowRightLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import MapPicker from "@/components/ui/MapPicker";
import { toast } from "sonner";
import OperatingHoursModal from "@/components/OperatingHoursModal";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { OutletType, type Outlet } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outletManagementApi, uploadApi } from "@/lib/api";
import { EmptyOutletState } from "../ui/empty-outlet";
import { useRouter } from "next/navigation";
import { SectionHeader } from "../ui/section-header";
import { TransferOutletDialog } from "./TransferOutletDialog";
import {
  ReusableForm,
  type FormFieldConfig,
} from "@/components/ui/reuseable-form";
import { z } from "zod";

const outletSchema = z.object({
  name: z.string().min(1, "Nama outlet wajib diisi"),
  isOpen: z.boolean(),
  type: z.nativeEnum(OutletType),
  description: z.string().optional(),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().min(1, "Alamat lengkap wajib diisi"),
  latitude: z.number(),
  longitude: z.number(),
  image: z.any().optional(),
  manualQrImageUrl: z.any().optional(),
});

type OutletFormValues = z.infer<typeof outletSchema>;

function ManageOutletSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-full opacity-50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-md gap-0 py-0 overflow-hidden border-border/40 bg-muted/5">
            <Skeleton className="h-56 w-full rounded-t-md" />
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-1/2 rounded-md" />
              <Skeleton className="h-16 w-full rounded-md opacity-40" />
            </CardContent>
          </Card>
          <Card className="rounded-md border-border/40 bg-muted/5">
            <CardHeader className="gap-0 pt-4">
              <Skeleton className="h-6 w-48 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/20"
                >
                  <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-2 w-16 rounded-full" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="rounded-md gap-py-0 border-border/40 bg-muted/5">
            <CardHeader>
              <Skeleton className="h-6 w-24 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-square w-full rounded-xl opacity-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ManageOutletContent() {
  const {
    selectedOutlet,
    setSelectedOutlet,
    isLoading: outletLoading,
  } = useOutletContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isOperatingHoursModalOpen, setIsOperatingHoursModalOpen] =
    useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedOutlet) {
      setIsEditing(false);
      setIsOperatingHoursModalOpen(false);
    }
  }, [selectedOutlet?.id]);

  const handleSave = async (values: FormData) => {
    if (!selectedOutlet) return;

    let nextImageUrl: string | undefined;
    let nextQrImageUrl: string | undefined;

    const outletImage = values.get("image");
    const qrisImage = values.get("manualQrImageUrl");

    // Only send image fields when the user uploads a new file.
    if (outletImage instanceof File) {
      nextImageUrl = (
        await uploadApi.uploadImage(outletImage, { scope: "outlet" })
      ).url;
    }
    if (qrisImage instanceof File) {
      nextQrImageUrl = (
        await uploadApi.uploadImage(qrisImage, { scope: "outlet" })
      ).url;
    }

    const payload = {
      name: values.get("name") as string,
      isOpen: values.get("isOpen") === "true",
      type: values.get("type") as OutletType,
      phone: values.get("phone") as string,
      address: values.get("address") as string,
      latitude: Number(values.get("latitude")) as number,
      longitude: Number(values.get("longitude")) as number,
      description: values.get("description") as string,
    };

    try {
      const updateData: Partial<Outlet> = {
        ...payload,
        ...(nextImageUrl !== undefined ? { image: nextImageUrl } : {}),
        ...(nextQrImageUrl !== undefined
          ? { manualQrImageUrl: nextQrImageUrl }
          : {}),
      };

      const updatedOutlet = await outletManagementApi.update(
        selectedOutlet.id,
        updateData,
      );

      setSelectedOutlet({
        ...selectedOutlet,
        ...payload,
        ...(nextImageUrl !== undefined ? { image: nextImageUrl } : {}),
        ...(nextQrImageUrl !== undefined
          ? { manualQrImageUrl: nextQrImageUrl }
          : {}),
        ...(updatedOutlet || {}),
      });

      setIsEditing(false);
      toast.success("Outlet berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui outlet");
    }
  };

  const { mutate: submit, isPending: isSaving } = useMutation({
    mutationFn: handleSave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({
        queryKey: ["outlet", selectedOutlet?.id],
      });
    },
  });

  const formFields = useMemo<FormFieldConfig<OutletFormValues>[]>(
    () => [
      {
        name: "image",
        label: "Foto Profil Outlet",
        type: "file",
        className: "mx-auto",
        description: "Unggah foto utama outlet agar profil lebih profesional.",
        placeholder: "Unggah gambar JPG/PNG/WEBP maksimal 2MB",
        maxSizes: 2 * 1024 * 1024,
        accept: {
          "image/jpeg": [".jpg", ".jpeg"],
          "image/png": [".png"],
          "image/webp": [".webp"],
        },
        colSpan: 6,
      },
      {
        name: "manualQrImageUrl",
        label: "Pembayaran QRIS",
        type: "file",
        description:
          "Upload QRIS static terbaru agar pelanggan bisa membayar tanpa kendala.",
        placeholder: "Unggah gambar QRIS JPG/PNG/WEBP maksimal 2MB",
        maxSizes: 2 * 1024 * 1024,
        accept: {
          "image/jpeg": [".jpg", ".jpeg"],
          "image/png": [".png"],
          "image/webp": [".webp"],
        },
        colSpan: 6,
      },
      {
        name: "name",
        label: "Nama Outlet",
        type: "text",
        placeholder: "Contoh: Kedai Kopi Senja",
        description:
          "Nama ini akan tampil di dashboard, struk, dan halaman pelanggan.",
        colSpan: 6,
      },
      {
        name: "isOpen",
        label: "Status Operasional",
        type: "dual-option-switch",
        description:
          "Atur status buka/tutup agar pelanggan melihat ketersediaan outlet secara real-time.",
        colSpan: 6,
        switchOptions: {
          left: {
            label: "Tutup",
            value: false,
            activeClass: "text-rose-500 font-bold",
          },
          right: {
            label: "Buka",
            value: true,
            activeClass: "text-emerald-500 font-bold",
          },
        },
      },
      {
        name: "phone",
        label: "Nomor Telepon",
        type: "text",
        icon: Phone,
        placeholder: "08xx-xxxx-xxxx",
        description: "Kontak utama untuk pelanggan atau kebutuhan operasional.",
        colSpan: 6,
      },
      {
        name: "type",
        label: "Tipe Bisnis",
        type: "select",
        colSpan: 6,
        placeholder: "Pilih Tipe Bisnis",
        description:
          "Menentukan fitur default yang paling relevan untuk operasional outlet.",
        options: [
          { label: "F&B (Makanan & Minuman)", value: OutletType.FNB },
          { label: "Retail (Barang/Stok)", value: OutletType.RETAIL },
          { label: "Jasa (Layanan/Booking)", value: OutletType.SERVICE },
          { label: "Event (Tiket/Check-in)", value: OutletType.EVENT },
          { label: "Custom (Semua Fitur)", value: OutletType.CUSTOM },
        ],
      },
      {
        name: "description",
        label: "Deskripsi & Bio",
        type: "textarea",
        placeholder: "Gambarkan suasana atau keunggulan outlet Anda...",
        description:
          "Gunakan kalimat singkat yang menjelaskan karakter dan keunikan outlet.",
        className: "min-h-24",
        colSpan: 12,
      },
      {
        name: "address",
        label: "Alamat Lengkap",
        type: "textarea",
        icon: MapPin,
        placeholder: "Sebutkan jalan, nomor, dan patokan terdekat...",
        description:
          "Alamat rinci membantu kurir, tamu, dan pelanggan menemukan lokasi dengan cepat.",
        className: "min-h-28",
        colSpan: 12,
      },
      {
        name: "latitude",
        label: "Lokasi (Peta)",
        type: "custom",
        colSpan: 12,
        description:
          "Geser pin di peta agar koordinat outlet akurat untuk pelacakan dan navigasi.",
        renderCustom: ({ values, form }) => (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20 p-2">
              <MapPicker
                showControls
                mapProps={{ projection: { type: "globe" } }}
                latitude={values.latitude || 0}
                longitude={values.longitude || 0}
                onLocationChange={(lat, lng) => {
                  form.setValue("latitude", lat, { shouldDirty: true });
                  form.setValue("longitude", lng, { shouldDirty: true });
                }}
                className="w-full"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Koordinat: {(values.latitude || 0).toFixed(6)},{" "}
              {(values.longitude || 0).toFixed(6)}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  if (!selectedOutlet?.id)
    return (
      <EmptyOutletState
        onAddOutlet={() => router.push("/owner#add-outlet")}
      />
    );
  if (outletLoading) return <ManageOutletSkeleton />;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Profil Outlet"
        description="Kelola identitas visual dan informasi operasional outlet Anda."
        badge={
          <div className="flex items-center gap-2">
            <Badge
              variant={selectedOutlet.isOpen ? "success" : "destructive"}
              className="px-3 py-0.5 rounded-md border border-current/20 text-[10px] font-black uppercase tracking-widest bg-current/5 shadow-none"
            >
              {selectedOutlet.isOpen ? "Buka" : "Tutup"}
            </Badge>
            <Badge
              variant="outline"
              className="px-3 py-0.5 rounded-md border-border/80 text-[10px] font-black uppercase tracking-widest bg-muted/20 text-muted-foreground shadow-none"
            >
              {selectedOutlet.type || "Custom"}
            </Badge>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOperatingHoursModalOpen(true)}
                  className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
                >
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  Jam Operasional
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTransferDialogOpen(true)}
                  className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
                >
                  <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                  Transfer Outlet
                </Button>
                <Separator
                  orientation="vertical"
                  className="h-8 mx-1 hidden sm:block"
                />
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-10 px-6 font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit Profil
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="w-full">
        {isEditing ? (
          <Card className="rounded-md border-border/80 gap-0 py-0 bg-background shadow-sm overflow-hidden">
            <CardHeader className="border-b gap-0 pt-4 border-border/40 bg-muted/10 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase tracking-widest">
                  Edit Profil Outlet
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">
                  Perbarui informasi dasar dan visual outlet Anda.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mx-auto w-full">
                <ReusableForm
                  schema={outletSchema}
                  fields={formFields}
                  defaultValues={{
                    name: selectedOutlet.name,
                    isOpen: selectedOutlet.isOpen ?? false,
                    type: selectedOutlet.type || OutletType.CUSTOM,
                    description: selectedOutlet.description || "",
                    phone: selectedOutlet.phone || "",
                    address: selectedOutlet.address || "",
                    latitude: selectedOutlet.latitude || 0,
                    longitude: selectedOutlet.longitude || 0,
                    image: selectedOutlet.image,
                    manualQrImageUrl: selectedOutlet.manualQrImageUrl,
                  }}
                  onSubmit={(v) => submit(v)}
                  isLoading={isSaving}
                  submitText="Simpan Perubahan"
                  errorSummary
                  gridCols={12}
                  useFormData
                  renderFooter={
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="h-10 px-4 font-bold text-xs uppercase tracking-wider"
                      >
                        <X className="mr-2 h-3.5 w-3.5" />
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="h-10 px-5 font-bold text-xs uppercase tracking-wider"
                      >
                        <Save className="mr-2 h-3.5 w-3.5" />
                        Simpan Perubahan
                      </Button>
                    </div>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-md overflow-hidden gap-0 py-0 border-border/80 bg-background shadow-sm">
                <div className="relative h-48 overflow-hidden bg-muted">
                  {selectedOutlet.image ? (
                    <img
                      src={selectedOutlet.image}
                      alt={selectedOutlet.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/30">
                      <Store className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent text-white">
                    <h2 className="text-xl font-black tracking-tight">
                      {selectedOutlet.name}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      Profil Outlet
                    </p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Biodata & Deskripsi
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                      {selectedOutlet.description ||
                        "Tidak ada deskripsi untuk outlet ini."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md border-border/80 gap-0 py-0 bg-background shadow-sm overflow-hidden">
                <CardHeader className="border-b gap-0 pt-4 border-border/40 bg-muted/30">
                  <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    Kontak & Lokasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/20 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card border border-border shadow-sm">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Telepon
                        </p>
                        <p className="text-sm font-black text-foreground">
                          {selectedOutlet.phone || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/20 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card border border-border shadow-sm mt-0.5">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Alamat Fisik
                        </p>
                        <p className="text-sm font-bold text-foreground/90 leading-relaxed">
                          {selectedOutlet.address || "-"}
                        </p>
                      </div>
                    </div>
                    {selectedOutlet.latitude && (
                      <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/20 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card border border-border shadow-sm">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Koordinat
                          </p>
                          <p className="text-sm font-mono font-bold text-foreground tabular-nums">
                            {selectedOutlet.latitude.toFixed(6)},{" "}
                            {selectedOutlet.longitude?.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="rounded-md gap-0 py-0 border-border/80 bg-background shadow-sm overflow-hidden">
                <CardHeader className="border-b gap-0 pt-4 border-border/40 bg-muted/30">
                  <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
                    <QrCode className="h-4 w-4 text-primary" />
                    Pembayaran QRIS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedOutlet.manualQrImageUrl ? (
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-md border border-border/80 bg-card p-4 shadow-sm">
                        <img
                          src={selectedOutlet.manualQrImageUrl}
                          alt="QRIS"
                          className="mx-auto aspect-square w-full object-contain"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase tracking-tighter shadow-none">
                            Terverifikasi
                          </Badge>
                        </div>
                      </div>
                      <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
                        Scan untuk melakukan pembayaran digital.
                      </p>
                    </div>
                  ) : (
                    <div className="aspect-square flex flex-col items-center justify-center rounded-md border border-border/60 bg-muted/20 text-muted-foreground/40">
                      <QrCode className="h-16 w-16 mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                        QRIS belum dikonfigurasi
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-md gap-0 py-0 border-border/80 bg-background shadow-sm overflow-hidden">
                <CardHeader className="border-b gap-0 pt-4 border-border/40 bg-muted/30 p-4">
                  <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
                    <Zap className="h-4 w-4 text-primary" />
                    Ringkasan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {[
                      {
                        label: "Operasional",
                        value: selectedOutlet.isOpen ? "Buka" : "Tutup",
                        variant: selectedOutlet.isOpen
                          ? "success"
                          : "destructive",
                      },
                      {
                        label: "Payment",
                        value: selectedOutlet.manualQrImageUrl
                          ? "Tersedia"
                          : "Belum Ada",
                        variant: selectedOutlet.manualQrImageUrl
                          ? "success"
                          : "outline",
                      },
                      {
                        label: "Geolokasi",
                        value: selectedOutlet.latitude
                          ? "Tersedia"
                          : "Belum Set",
                        variant: selectedOutlet.latitude
                          ? "success"
                          : "outline",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">
                          {item.label}
                        </span>
                        <Badge
                          variant={item.variant as any}
                          className="px-2 py-0 rounded-md border text-[9px] font-black uppercase tracking-tighter shadow-none"
                        >
                          {item.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <OperatingHoursModal
        isOpen={isOperatingHoursModalOpen}
        onClose={() => setIsOperatingHoursModalOpen(false)}
        outletId={selectedOutlet?.id || ""}
      />

      {selectedOutlet && (
        <TransferOutletDialog
          isOpen={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          outletId={selectedOutlet.id}
          outletName={selectedOutlet.name}
        />
      )}
    </div>
  );
}
