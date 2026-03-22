"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profil Saya</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Informasi akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1 rounded-md border p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">Nama Lengkap</p>
            <p className="text-sm font-medium">{user.name || "-"}</p>
          </div>
          <div className="space-y-1 rounded-md border p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user.email || "-"}</p>
          </div>
          <div className="space-y-1 rounded-md border p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="text-sm font-medium">{user.role || "-"}</p>
          </div>
          <div className="space-y-1 rounded-md border p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">ID Pengguna</p>
            <p className="text-sm font-medium break-all">{user.id || "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
