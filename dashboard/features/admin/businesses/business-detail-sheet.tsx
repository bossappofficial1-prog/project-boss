"use client";

import React, { useState } from "react";
import {
  Building2,
  CreditCard,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Store,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Shield,
  ExternalLink,
  Package,
  Clock,
  XCircle,
  Copy,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  description?: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isVerified: boolean;
    avatar?: string;
  };
  outlets?: Array<{
    id: string;
    name: string;
    address?: string;
    isOpen?: boolean;
    _count?: { orders: number };
  }>;
  _count?: {
    outlets: number;
    orders: number;
  };
}

interface Props {
  business: Business | null;
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSuspend: (businessId: string, isSuspended: boolean) => Promise<void>;
  onDelete: (businessId: string) => Promise<void>;
  isSuspendPending?: boolean;
  isDeletePending?: boolean;
}

export default function BusinessDetailSheet({
  business,
  isOpen,
  onClose,
  onSuspend,
  onDelete,
  isSuspendPending,
  isDeletePending,
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!business) return null;

  const isSuspended = business.subscriptionStatus === "SUSPENDED";

  const statusConfig: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    ACTIVE: {
      label: "Aktif",
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    SUSPENDED: {
      label: "Suspended",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      icon: <XCircle className="h-3 w-3" />,
    },
    TRIAL: {
      label: "Trial",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: <Clock className="h-3 w-3" />,
    },
    EXPIRED: {
      label: "Expired",
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      icon: <XCircle className="h-3 w-3" />,
    },
    AWAITING_PAYMENT: {
      label: "Menunggu Bayar",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      icon: <Clock className="h-3 w-3" />,
    },
  };

  const statusInfo =
    statusConfig[business.subscriptionStatus] || statusConfig.ACTIVE;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} disalin`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleSuspend = async () => {
    try {
      await onSuspend(business.id, !isSuspended);
      toast.success(
        `Bisnis berhasil di${isSuspended ? "aktifkan" : "suspend"}`,
      );
    } catch {
      toast.error("Gagal mengubah status bisnis");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(business.id);
      toast.success("Bisnis berhasil dihapus");
      onClose(false);
      setShowDeleteDialog(false);
    } catch {
      toast.error("Gagal menghapus bisnis");
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg w-[95vw] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="p-6 pb-4">
              <SheetHeader className="text-left space-y-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 min-w-0">
                    <Avatar className="h-12 w-12 rounded-lg border border-border shrink-0">
                      <AvatarFallback className="rounded-lg bg-muted">
                        <Store className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <SheetTitle className="text-lg font-semibold leading-tight truncate">
                        {business.name}
                      </SheetTitle>
                      <SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {business.id.split("-")[0]}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {business.owner?.email}
                        </span>
                      </SheetDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={statusInfo.className}
                        >
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                        {business.subscriptionPlan && (
                          <Badge variant="secondary" className="text-[10px]">
                            {business.subscriptionPlan}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant={isSuspended ? "default" : "outline"}
                    size="sm"
                    className={
                      isSuspended
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        : "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5"
                    }
                    onClick={handleSuspend}
                    disabled={isSuspendPending}
                  >
                    {isSuspended ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aktifkan
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" /> Suspend
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                </div>
              </SheetHeader>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="gap-1.5 text-xs">
                  <Building2 className="h-3.5 w-3.5" /> Profil
                </TabsTrigger>
                <TabsTrigger value="bank" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" /> Bank
                </TabsTrigger>
                <TabsTrigger value="outlets" className="gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Outlet
                </TabsTrigger>
              </TabsList>

              {/* TAB: Overview */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="py-0 gap-0">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {business._count?.outlets || 0}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                        Outlet
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="py-0 gap-0">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {business._count?.orders || 0}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                        Transaksi
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Business Info */}
                <Card className="gap-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Informasi Bisnis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Nama" value={business.name} />
                    <InfoRow
                      label="Deskripsi"
                      value={business.description || "~"}
                    />
                    <InfoRow
                      label="Terdaftar"
                      value={
                        business.createdAt
                          ? new Date(business.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "-"
                      }
                    />
                  </CardContent>
                </Card>

                {/* Owner Info */}
                <Card className="gap-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Pemilik
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="text-xs bg-muted">
                          {business.owner?.name
                            ?.substring(0, 2)
                            .toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {business.owner?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {business.owner?.email}
                        </p>
                      </div>
                      {business.owner?.isVerified ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0"
                        >
                          <Shield className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>
                    {business.owner?.phone && (
                      <div className="flex items-center gap-3 p-2 rounded-lg">
                        <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{business.owner.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card className="gap-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Langganan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Paket
                      </span>
                      <Badge variant="secondary" className="font-semibold">
                        {business.subscriptionPlan || "TRIAL"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Status
                      </span>
                      <Badge variant="outline" className={statusInfo.className}>
                        {statusInfo.icon}
                        <span className="ml-1">{statusInfo.label}</span>
                      </Badge>
                    </div>
                    {business.subscriptionEndDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Berakhir
                        </span>
                        <span className="text-xs font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(
                            business.subscriptionEndDate,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Bank */}
              <TabsContent value="bank" className="mt-0">
                {business.bankName ? (
                  <Card className="py-0 gap-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Rekening Bank
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-md bg-background border border-border flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {business.bankName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Bank Account
                            </p>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Nomor Rekening
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                {business.bankAccount}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleCopy(
                                    business.bankAccount!,
                                    "Nomor rekening",
                                  )
                                }
                              >
                                {copied === "Nomor rekening" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Atas Nama
                            </span>
                            <span className="text-sm font-medium">
                              {business.accountHolder}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-2 py-0 border-border">
                    <CardContent className="py-4">
                      <div className="text-center text-muted-foreground">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Belum ada informasi rekening bank
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB: Outlets */}
              <TabsContent value="outlets" className="mt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Daftar Outlet ({business.outlets?.length || 0})
                    </h4>
                  </div>
                  {business.outlets && business.outlets.length > 0 ? (
                    business.outlets.map((outlet) => (
                      <Card
                        key={outlet.id}
                        className="overflow-hidden gap-0 py-0"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {outlet.name}
                                </p>
                                {outlet.isOpen !== undefined && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      outlet.isOpen
                                        ? "text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : "text-[10px] bg-muted text-muted-foreground"
                                    }
                                  >
                                    {outlet.isOpen ? "Buka" : "Tutup"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {outlet.address || "Tidak ada alamat"}
                              </p>
                              {outlet._count?.orders !== undefined && (
                                <p className="text-xs text-primary font-medium mt-1">
                                  {outlet._count.orders} Orders
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed border-2 py-0 border-border">
                      <CardContent className="py-6">
                        <div className="text-center text-muted-foreground">
                          <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Belum ada outlet</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Bisnis"
        description={
          <span>
            Apakah Anda yakin ingin menghapus bisnis{" "}
            <strong>"{business.name}"</strong>? Tindakan ini permanen dan akan
            menghapus seluruh data terkait termasuk outlet, produk, dan
            transaksi.
          </span>
        }
        confirmLabel="Hapus Bisnis"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        confirmLoading={isDeletePending}
      />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
