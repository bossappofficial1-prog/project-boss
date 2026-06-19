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
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import MapPicker from "@/components/ui/map-picker";
import { gooeyToast } from "goey-toast";
import OperatingHoursModal from "@/components/operating-hours-modal";
import { useOutletStore } from "@/stores/outlet.store";
import { OutletType, type Outlet } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outletManagementApi, uploadApi } from "@/lib/api";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/section-header";
import {
  ReusableForm,
  type FormFieldConfig,
} from "@/components/ui/reuseable-form";
import { z } from "zod";
import { useUserData } from "@/hooks/use-user-data";
import { OutletHero } from "./outlet-hero";
import {
  OutletInfoCard,
  OutletInfoField,
  OutletStatusGrid,
} from "./outlet-info-card";

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
  qrisString: z.string().optional(),
});

type OutletFormValues = z.infer<typeof outletSchema>;

function ManageOutletSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-5 w-96 rounded-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

export default function ManageOutletContent() {
  const {
    selectedOutlet,
    setSelectedOutlet,
    isLoading: outletLoading,
    isPlanMismatch,
  } = useOutletStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: userData } = useUserData();

  const [isEditing, setIsEditing] = useState(false);
  const [isOperatingHoursModalOpen, setIsOperatingHoursModalOpen] =
    useState(false);

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

    if (outletImage instanceof File) {
      try {
        nextImageUrl = (
          await uploadApi.uploadImage(outletImage, { scope: "outlet" })
        ).url;
      } catch (error) {
        throw error;
      }
    }
    if (qrisImage instanceof File) {
      try {
        nextQrImageUrl = (
          await uploadApi.uploadImage(qrisImage, { scope: "outlet" })
        ).url;
      } catch (error) {
        throw error;
      }
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
      qrisString: (values.get("qrisString") as string) || null,
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
      gooeyToast.success("Outlet berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    } catch (error: any) {
      gooeyToast.error(error.message || "Gagal memperbarui outlet");
    }
  };

  const { mutateAsync: submit, isPending: isSaving } = useMutation({
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
        ].filter((opt) => {
          if (opt.value === OutletType.CUSTOM) {
            const plan = userData?.business?.subscriptionPlan;
            return plan === "TRIAL" || plan === "PRO";
          }
          return true;
        }),
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
    [userData],
  );

  if (!selectedOutlet?.id)
    return (
      <EmptyOutletState onAddOutlet={() => router.push("/owner#add-outlet")} />
    );
  if (outletLoading) return <ManageOutletSkeleton />;

  const statusItems = [
    {
      label: "Operasional",
      value: selectedOutlet.isOpen ? "Buka" : "Tutup",
      variant: (selectedOutlet.isOpen ? "success" : "destructive") as
        | "success"
        | "destructive",
    },
    {
      label: "Payment",
      value: selectedOutlet.manualQrImageUrl ? "Tersedia" : "Belum Ada",
      variant: (selectedOutlet.manualQrImageUrl ? "success" : "outline") as
        | "success"
        | "outline",
    },
    {
      label: "Geolokasi",
      value: selectedOutlet.latitude ? "Tersedia" : "Belum Set",
      variant: (selectedOutlet.latitude ? "success" : "outline") as
        | "success"
        | "outline",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Plan mismatch alert */}
      {isPlanMismatch && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-1">
            <AlertTitle className="text-sm font-semibold">
              Limitasi Paket Terdeteksi
            </AlertTitle>
            <AlertDescription className="text-xs mt-1">
              Outlet ini bertipe <strong>CUSTOM</strong>, namun paket langganan
              Anda tidak mendukung tipe tersebut. Beberapa fitur akan dibatasi.
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="ml-auto shrink-0"
          >
            Ubah Tipe
          </Button>
        </Alert>
      )}

      <SectionHeader
        title="Profil Outlet"
        description="Kelola identitas visual dan informasi operasional outlet Anda."
        icon={Store}
      />

      {/* Hero Section */}
      <OutletHero
        outlet={selectedOutlet}
        onEdit={() => setIsEditing(true)}
        onOperatingHours={() => setIsOperatingHoursModalOpen(true)}
        onTransfer={() => router.push("/owner/transfer-outlet")}
      />

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact & Location */}
        <OutletInfoCard
          title="Kontak & Lokasi"
          icon={MapPin}
          description="Informasi komunikasi dan alamat outlet"
        >
          <div className="divide-y divide-border/40">
            <OutletInfoField
              icon={Phone}
              label="Telepon"
              value={selectedOutlet.phone || "-"}
            />
            <OutletInfoField
              icon={MapPin}
              label="Alamat"
              value={selectedOutlet.address || "-"}
            />
            {selectedOutlet.latitude ? (
              <OutletInfoField
                icon={Globe}
                label="Koordinat"
                value={`${selectedOutlet.latitude.toFixed(6)}, ${selectedOutlet.longitude?.toFixed(6)}`}
                mono
              />
            ) : null}
          </div>
        </OutletInfoCard>

        {/* QRIS Payment */}
        <OutletInfoCard
          title="Pembayaran QRIS"
          icon={QrCode}
          description="QR code untuk pembayaran digital"
        >
          {selectedOutlet.manualQrImageUrl ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card p-3">
                <img
                  src={selectedOutlet.manualQrImageUrl}
                  alt="QRIS"
                  className="mx-auto aspect-square w-full max-w-[200px] object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20"
                  >
                    Aktif
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                Scan untuk melakukan pembayaran digital
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
              <QrCode className="h-12 w-12 mb-2" />
              <p className="text-xs font-medium">QRIS belum dikonfigurasi</p>
            </div>
          )}
        </OutletInfoCard>
      </div>

      {/* Status Summary */}
      <OutletInfoCard
        title="Ringkasan Status"
        icon={Zap}
        description="Status operasional outlet saat ini"
      >
        <OutletStatusGrid items={statusItems} />
      </OutletInfoCard>

      {/* Edit Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-4 border-b border-border/60">
            <SheetTitle className="text-lg font-semibold">
              Edit Profil Outlet
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Perbarui informasi dasar dan visual outlet Anda.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
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
                qrisString: (selectedOutlet as any).qrisString || "",
              }}
              onSubmit={(v) => submit(v)}
              isLoading={isSaving}
              submitText="Simpan Perubahan"
              errorSummary
              gridCols={12}
              useFormData
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Operating Hours Modal */}
      <OperatingHoursModal
        isOpen={isOperatingHoursModalOpen}
        onClose={() => setIsOperatingHoursModalOpen(false)}
        outletId={selectedOutlet?.id || ""}
      />
    </div>
  );
}
