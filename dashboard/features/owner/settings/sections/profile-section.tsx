"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, ShieldCheck } from "lucide-react";
import { ProfileForm } from "../profile-form";

interface ProfileSectionProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    role?: string;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profil Pribadi
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi dasar akun Anda.
        </p>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Foto & Informasi Dasar</CardTitle>
          <CardDescription>
            Perbarui foto profil, nama, dan nomor telepon Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user.id}
            defaultValues={{
              name: user.name,
              avatar: user.avatar,
              phone: user.phone ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Kredensial Akun</CardTitle>
          <CardDescription>
            Informasi ini tidak dapat diubah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Alamat Email
              </p>
              <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-sm font-medium border border-border/60">
                {user.email || "-"}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Role
              </p>
              <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-sm font-medium border border-border/60 capitalize">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                  {user.role?.toLowerCase() || "-"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
