"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Lock, UserCog } from "lucide-react";

export function SettingsContent() {
  const { user, business, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[220px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[280px]" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi dashboard dan lihat informasi akun Anda.</p>
      </div>

      <Card className="rounded-md shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-red-500" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Data akun ditampilkan dalam mode baca saja.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Nama</p>
            <p className="text-sm font-medium">{user.name || "-"}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user.email || "-"}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="text-sm font-medium">{user.role || "-"}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Bisnis Aktif</p>
            <p className="text-sm font-medium">{business?.name || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            Preferensi Tampilan
          </CardTitle>
          <CardDescription>Atur mode tampilan dashboard Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Tema Dashboard</p>
              <p className="text-xs text-muted-foreground">Pilih mode terang atau gelap.</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            Keamanan
          </CardTitle>
          <CardDescription>Fitur keamanan lanjutan akan ditambahkan bertahap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Ubah Kata Sandi</p>
              <p className="text-xs text-muted-foreground">Saat ini belum tersedia dari halaman ini.</p>
            </div>
            <Badge variant="secondary">Segera Hadir</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Sesi Login</p>
              <p className="text-xs text-muted-foreground">Manajemen sesi perangkat segera tersedia.</p>
            </div>
            <Badge variant="secondary">Segera Hadir</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
