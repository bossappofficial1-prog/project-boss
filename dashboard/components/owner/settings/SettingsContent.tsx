"use client";

import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Lock, UserCog, Building2, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";

const profileSchema = z.object({
  avatar: z.any().optional(),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z
    .string()
    .regex(/^[0-9]*$/, "Nomor telepon hanya boleh angka")
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const profileFields: FormFieldConfig<ProfileFormValues>[] = [
  {
    name: "avatar",
    label: "Foto Profil",
    type: "file",
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSizes: 2 * 1024 * 1024, // 2MB
    description: "Format yang didukung: JPG, PNG, WEBP. Maksimal ukuran 2MB.",
    colSpan: "full",
  },
  {
    name: "name",
    label: "Nama Lengkap",
    type: "text",
    placeholder: "Masukkan nama lengkap Anda",
    colSpan: 1,
  },
  {
    name: "phone",
    label: "Nomor Telepon",
    type: "tel",
    placeholder: "Contoh: 081234567890",
    colSpan: 1,
  },
];

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi kata sandi tidak cocok",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const passwordFields: FormFieldConfig<PasswordFormValues>[] = [
  {
    name: "currentPassword",
    label: "Kata Sandi Saat Ini",
    type: "password",
    placeholder: "Masukkan kata sandi saat ini",
    colSpan: "full",
  },
  {
    name: "newPassword",
    label: "Kata Sandi Baru",
    type: "password",
    placeholder: "Minimal 8 karakter",
    colSpan: 1,
  },
  {
    name: "confirmPassword",
    label: "Konfirmasi Kata Sandi",
    type: "password",
    placeholder: "Ulangi kata sandi baru",
    colSpan: 1,
  },
];

export function SettingsContent() {
  const { user, business, isLoading } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  console.log(user, business)
  // Fungsi untuk menangani submit form profil
  const handleUpdateProfile = async (values: ProfileFormValues | FormData) => {
    try {
      setIsUpdatingProfile(true);

      // TODO: Panggil API Anda di sini untuk update profil
      // Contoh jika menggunakan FormData (karena ada file Avatar):
      // await axios.put('/api/users/profile', values, { headers: { 'Content-Type': 'multipart/form-data' } });

      console.log("Data profil yang disubmit:", values);

      // Simulasi delay jaringan
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("Profil berhasil diperbarui!"); // Ganti dengan toast/snackbar yang lebih modern
    } catch (error) {
      console.error("Gagal update profil:", error);
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Fungsi untuk menangani submit form password
  const handleUpdatePassword = async (values: PasswordFormValues | FormData) => {
    try {
      setIsUpdatingPassword(true);
      // TODO: Panggil API Anda di sini untuk update password
      console.log("Data password yang disubmit:", values);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert("Kata sandi berhasil diperbarui!");
    } catch (error) {
      console.error("Gagal update password:", error);
      alert("Terjadi kesalahan saat mengubah kata sandi.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading || !user) {
    return <SettingsSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun, preferensi sistem, dan keamanan Anda di satu tempat.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">

        {/* KOLOM KIRI: Form Edit Profil & Info Bisnis */}
        <div className="space-y-6 md:col-span-7 lg:col-span-8">

          {/* Card Form Profil Pribadi */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserCog className="h-5 w-5 text-primary" />
                Profil Pribadi & Keamanan
              </CardTitle>
              <CardDescription>
                Perbarui foto profil, nama, detail kontak, serta kata sandi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReusableForm<ProfileFormValues>
                schema={profileSchema}
                defaultValues={{
                  name: user.name || "",
                  phone: user.phone || "",
                  avatar: user.avatar || "",
                }}
                fields={profileFields}
                onSubmit={handleUpdateProfile}
                submitText="Simpan Profil"
                isLoading={isUpdatingProfile}
                gridCols={2} // Menggunakan 2 kolom grid (nama di kiri, hp di kanan)
                useFormData={true} // Wajib true karena ada upload file (avatar)
              />

              <Separator className="my-6" />

              {/* Form Ubah Kata Sandi */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Ubah Kata Sandi
                </h4>
                <ReusableForm<PasswordFormValues>
                  schema={passwordSchema}
                  defaultValues={{
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  }}
                  fields={passwordFields}
                  onSubmit={handleUpdatePassword}
                  submitText="Perbarui Kata Sandi"
                  isLoading={isUpdatingPassword}
                  gridCols={2}
                />
              </div>

              <Separator className="my-6" />

              {/* Field Read-only (Email & Role) */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Kredensial Akun
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Alamat Email (Tidak dapat diubah)</p>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5 text-sm font-medium border">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email || "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Role / Hak Akses</p>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2.5 text-sm font-medium border capitalize">
                      {user.role?.toLowerCase() || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Info Bisnis (Read-only) */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Informasi Bisnis
              </CardTitle>
              <CardDescription>
                Detail organisasi atau bisnis yang terhubung dengan akun Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-lg">{business?.name || "Belum ada bisnis"}</p>
                    <p className="text-sm text-muted-foreground">{business?.description || "Deskripsi belum diatur"}</p>
                  </div>
                  <Badge variant={business?.subscriptionStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                    {business?.subscriptionStatus || "TIDAK AKTIF"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                  <div>
                    <p className="text-muted-foreground">Paket Langganan</p>
                    <p className="font-medium">{business?.subscriptionPlan || "Basic"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Berlaku Hingga</p>
                    <p className="font-medium">
                      {business?.subscriptionEndDate
                        ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(business.subscriptionEndDate))
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* KOLOM KANAN: Preferensi & Keamanan */}
        <div className="space-y-6 md:col-span-5 lg:col-span-4">

          {/* Preferensi Tampilan */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-4 w-4 text-primary" />
                Preferensi Tampilan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Tema Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sesuaikan warna antarmuka agar nyaman di mata Anda.
                  </p>
                </div>
                <div className="mt-2 flex">
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keamanan */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-4 w-4 text-primary" />
                Keamanan Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">Sesi Login Teraktif</p>
                  <p className="text-xs text-muted-foreground mt-1">Kelola perangkat yang terhubung.</p>
                </div>
                <Badge variant="outline" className="text-xs">Segera</Badge>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}

// ==========================================
// KOMPONEN SKELETON (LOADING STATE)
// ==========================================
function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-5 w-96 rounded-md" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-7 lg:col-span-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-5 lg:col-span-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}