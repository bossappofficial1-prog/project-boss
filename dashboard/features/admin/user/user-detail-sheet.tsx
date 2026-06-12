'use client';

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  BadgeCheck,
  Building2,
  CreditCard,
  Settings2,
  CheckCircle2,
  Copy,
  Calendar,
  Shield,
  MapPin,
  ExternalLink,
  Clock,
  XCircle,
} from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UserDetail, useUserDetail } from '@/hooks/use-users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatISOStringDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  userId: string;
}

export default function UserDetailSheet({ isOpen, onClose, userId }: Props) {
  const { data: userDetail, isLoading } = useUserDetail(userId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-[95vw] overflow-y-auto p-0 gap-0">
        {isLoading ? (
          <UserDetailSkeleton />
        ) : userDetail ? (
          <UserDetailContent data={userDetail} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Data tidak ditemukan</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function UserDetailContent({ data }: { data: UserDetail }) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} disalin`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  if (!data) return null;

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    ACTIVE: {
      label: 'Aktif',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    SUSPENDED: {
      label: 'Suspended',
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: <XCircle className="h-3 w-3" />,
    },
    TRIAL: {
      label: 'Trial',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: <Clock className="h-3 w-3" />,
    },
    EXPIRED: {
      label: 'Expired',
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const subscriptionStatus = data.business?.subscriptionStatus || 'ACTIVE';
  const statusInfo = statusConfig[subscriptionStatus] || statusConfig.ACTIVE;

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="p-6 pb-4">
          <SheetHeader className="text-left space-y-0">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={data.avatar ?? '/defaults/default-avatar.jpg'}
                  className="h-14 w-14 rounded-full border-2 border-border object-cover"
                  alt={data.name}
                />
                {data.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                    <BadgeCheck className="text-primary h-4 w-4 fill-primary/10" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold leading-tight truncate">
                  {data.name}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-0.5">
                  {data.email}
                </SheetDescription>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] font-semibold uppercase">
                    {data.role}
                  </Badge>
                  {data.isVerified ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <Shield className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <Shield className="h-3 w-3 mr-1" /> Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="business" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="business" className="gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5" /> Bisnis
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" /> Bank
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" /> Plan
            </TabsTrigger>
          </TabsList>

          {/* TAB: Business */}
          <TabsContent value="business" className="space-y-4 mt-0">
            {/* Business Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Informasi Bisnis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nama Bisnis" value={data.business?.name || '-'} />
                <InfoRow label="Deskripsi" value={data.business?.description || '~'} />
                {data.business?.subscriptionPlan && (
                  <InfoRow label="Paket" value={data.business.subscriptionPlan} />
                )}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Kontak Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ContactItem
                  icon={<Phone className="h-4 w-4" />}
                  label="Telepon"
                  value={data.phone || '-'}
                  color="emerald"
                  onCopy={() => data.phone && handleCopy(data.phone, 'Nomor telepon')}
                  copied={copied === 'Nomor telepon'}
                />
                <ContactItem
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={data.email}
                  color="blue"
                  onCopy={() => handleCopy(data.email, 'Email')}
                  copied={copied === 'Email'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Bank */}
          <TabsContent value="bank" className="mt-0">
            {data.business?.bankName ? (
              <Card>
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
                        <p className="font-semibold text-sm">{data.business.bankName}</p>
                        <p className="text-xs text-muted-foreground">Bank Account</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Nomor Rekening</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{data.business.bankAccount}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(data.business.bankAccount!, 'Nomor rekening')}
                          >
                            {copied === 'Nomor rekening' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Atas Nama</span>
                        <span className="text-sm font-medium">{data.business.accountHolder}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada informasi rekening bank</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Plan */}
          <TabsContent value="plan" className="space-y-4 mt-0">
            {/* Subscription Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  Status Langganan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paket</span>
                  <Badge variant="secondary" className="font-semibold">
                    {data.business?.subscriptionPlan || 'TRIAL'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={statusInfo.className}>
                    {statusInfo.icon}
                    <span className="ml-1">{statusInfo.label}</span>
                  </Badge>
                </div>
                {data.business?.subscriptionEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Berakhir</span>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(data.business.subscriptionEndDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Invoice Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentInvoice && data.recentInvoice.length > 0 ? (
                  <div className="space-y-2">
                    {data.recentInvoice.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-medium">#{invoice.invoiceNumber}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatISOStringDate(invoice.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold font-mono">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <CreditCard className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Belum ada invoice</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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

function ContactItem({
  icon,
  label,
  value,
  color,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'emerald' | 'blue';
  onCopy: () => void;
  copied: boolean;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`h-8 w-8 rounded-md flex items-center justify-center border ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCopy}>
        {copied ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
