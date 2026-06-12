'use client';

import React, { useState } from 'react';
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
  Shield,
  Clock,
  XCircle,
  Copy,
  Activity,
  Heart,
  Bell,
  Settings,
  Package,
  Send,
  Loader2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useUpdateBusiness,
  useBusinessHealthScore,
  useBusinessActivity,
  useSubscriptionPlans,
  useBusinessSubscription,
  useChangeSubscriptionPlan,
  useExtendSubscription,
  useCancelSubscription,
  useSendNotification,
  useBusinessSettings,
  useUpdateBusinessSettings,
} from '@/lib/apis/admin-business-management';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

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
  _count?: { outlets: number; orders: number };
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

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  SUSPENDED: { label: 'Suspended', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="h-3 w-3" /> },
  TRIAL: { label: 'Trial', className: 'bg-primary/10 text-primary border-primary/20', icon: <Clock className="h-3 w-3" /> },
  EXPIRED: { label: 'Expired', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <XCircle className="h-3 w-3" /> },
  AWAITING_PAYMENT: { label: 'Menunggu Bayar', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
};

export default function BusinessDetailSheet({ business, isOpen, onClose, onSuspend, onDelete, isSuspendPending, isDeletePending }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!business) return null;

  const isSuspended = business.subscriptionStatus === 'SUSPENDED';
  const statusInfo = STATUS_CONFIG[business.subscriptionStatus] || STATUS_CONFIG.ACTIVE;

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

  const handleSuspend = async () => {
    try {
      await onSuspend(business.id, !isSuspended);
      toast.success(`Bisnis berhasil di${isSuspended ? 'aktifkan' : 'suspend'}`);
    } catch {
      toast.error('Gagal mengubah status bisnis');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(business.id);
      toast.success('Bisnis berhasil dihapus');
      onClose(false);
      setShowDeleteDialog(false);
    } catch {
      toast.error('Gagal menghapus bisnis');
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-xl w-[95vw] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="p-6">
              <SheetHeader className="text-left space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 rounded-lg border border-border shrink-0">
                    <AvatarFallback className="rounded-lg bg-muted">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base font-semibold leading-tight truncate">
                      {business.name}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {business.id.split('-')[0]}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {business.owner?.email}
                      </span>
                    </SheetDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={statusInfo.className}>
                    {statusInfo.icon}
                    <span className="ml-1">{statusInfo.label}</span>
                  </Badge>
                  {business.subscriptionPlan && (
                    <Badge variant="secondary" className="text-[10px]">
                      {business.subscriptionPlan}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isSuspended ? 'default' : 'outline'}
                    size="sm"
                    className={isSuspended ? 'gap-1.5' : 'text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5'}
                    onClick={handleSuspend}
                    disabled={isSuspendPending}
                  >
                    {isSuspended ? <><CheckCircle2 className="h-3.5 w-3.5" /> Aktifkan</> : <><Ban className="h-3.5 w-3.5" /> Suspend</>}
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                </div>
              </SheetHeader>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full mb-6 overflow-x-auto flex-nowrap justify-start">
                <TabsTrigger value="overview" className="gap-1.5 text-xs shrink-0">
                  <Building2 className="h-3.5 w-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="finance" className="gap-1.5 text-xs shrink-0">
                  <CreditCard className="h-3.5 w-3.5" /> Keuangan
                </TabsTrigger>
                <TabsTrigger value="operations" className="gap-1.5 text-xs shrink-0">
                  <Activity className="h-3.5 w-3.5" /> Operasional
                </TabsTrigger>
                <TabsTrigger value="health" className="gap-1.5 text-xs shrink-0">
                  <Heart className="h-3.5 w-3.5" /> Health
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-1.5 text-xs shrink-0">
                  <Settings className="h-3.5 w-3.5" /> Aksi
                </TabsTrigger>
              </TabsList>

              {/* TAB: Overview */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Outlet" value={business._count?.outlets || 0} icon={<MapPin className="h-4 w-4" />} />
                  <StatCard label="Transaksi" value={business._count?.orders || 0} icon={<Package className="h-4 w-4" />} />
                </div>

                <InfoSection title="Informasi Bisnis" icon={<Building2 className="h-4 w-4" />}>
                  <InfoRow label="Nama" value={business.name} />
                  <InfoRow label="Deskripsi" value={business.description || '~'} />
                  <InfoRow label="Terdaftar" value={formatDate(business.createdAt)} />
                </InfoSection>

                <InfoSection title="Pemilik" icon={<Users className="h-4 w-4" />}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="text-xs bg-muted">
                        {business.owner?.name?.substring(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{business.owner?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{business.owner?.email}</p>
                    </div>
                    <VerificationBadge isVerified={business.owner?.isVerified} />
                  </div>
                  {business.owner?.phone && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {business.owner.phone}
                    </div>
                  )}
                </InfoSection>

                <InfoSection title="Langganan" icon={<Package className="h-4 w-4" />}>
                  <InfoRow label="Paket" value={business.subscriptionPlan || 'TRIAL'} />
                  <InfoRow label="Status" value={statusInfo.label} />
                  {business.subscriptionEndDate && (
                    <InfoRow label="Berakhir" value={formatDate(business.subscriptionEndDate)} />
                  )}
                </InfoSection>
              </TabsContent>

              {/* TAB: Keuangan (Bank + Subscription) */}
              <TabsContent value="finance" className="space-y-4 mt-0">
                <BankSection business={business} onCopy={handleCopy} copied={copied} />
                <SubscriptionSection business={business} />
              </TabsContent>

              {/* TAB: Operasional (Outlets + Activity) */}
              <TabsContent value="operations" className="space-y-4 mt-0">
                <OutletsSection business={business} />
                <ActivitySection businessId={business.id} />
              </TabsContent>

              {/* TAB: Health */}
              <TabsContent value="health" className="mt-0">
                <HealthSection businessId={business.id} />
              </TabsContent>

              {/* TAB: Aksi (Notifications + Settings) */}
              <TabsContent value="actions" className="space-y-4 mt-0">
                <NotificationSection business={business} />
                <SettingsSection businessId={business.id} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Bisnis"
        description={<span>Apakah Anda yakin ingin menghapus bisnis <strong>&quot;{business.name}&quot;</strong>? Tindakan ini permanen.</span>}
        confirmLabel="Hapus Bisnis"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        confirmLoading={isDeletePending}
      />
    </>
  );
}

// ===== Shared Components =====

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold">{value}</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right truncate">{value}</span>
    </div>
  );
}

function VerificationBadge({ isVerified }: { isVerified?: boolean }) {
  return isVerified ? (
    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
      <Shield className="h-3 w-3 mr-1" /> Verified
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground shrink-0">
      <AlertTriangle className="h-3 w-3 mr-1" /> Unverified
    </Badge>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ===== Bank Section =====

function BankSection({ business, onCopy, copied }: { business: Business; onCopy: (t: string, l: string) => void; copied: string | null }) {
  if (!business.bankName) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <CreditCard className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada rekening bank</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <InfoSection title="Rekening Bank" icon={<CreditCard className="h-4 w-4" />}>
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded bg-background border border-border flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-semibold text-sm">{business.bankName}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">No. Rekening</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs">{business.bankAccount}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onCopy(business.bankAccount!, 'Nomor rekening')}>
              {copied === 'Nomor rekening' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">Atas Nama</span>
          <span className="text-xs font-medium">{business.accountHolder}</span>
        </div>
      </div>
    </InfoSection>
  );
}

// ===== Subscription Section =====

function SubscriptionSection({ business }: { business: Business }) {
  const { data: plans } = useSubscriptionPlans();
  const { data: subscription, isLoading } = useBusinessSubscription(business.id);
  const changePlan = useChangeSubscriptionPlan();
  const extendSub = useExtendSubscription();
  const [extendDays, setExtendDays] = useState('30');

  return (
    <InfoSection title="Kelola Langganan" icon={<Package className="h-4 w-4" />}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Plan Saat Ini</span>
          <Badge variant="secondary" className="font-semibold text-[10px]">{business.subscriptionPlan || 'TRIAL'}</Badge>
        </div>

        {business.subscriptionEndDate && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Berakhir</span>
            <span className="text-xs font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {formatDate(business.subscriptionEndDate)}
            </span>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs">Ubah Plan</Label>
          <Select onValueChange={(planId) => changePlan.mutate({ businessId: business.id, planId })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pilih plan baru" /></SelectTrigger>
            <SelectContent>
              {plans?.map((plan: any) => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name} - {formatCurrency(plan.price)}/bln</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Perpanjang (hari)</Label>
          <div className="flex gap-2">
            <Input type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} className="h-9 text-xs" min="1" max="365" />
            <Button size="sm" onClick={() => extendSub.mutate({ businessId: business.id, days: parseInt(extendDays) })} disabled={extendSub.isPending}>
              {extendSub.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Perpanjang'}
            </Button>
          </div>
        </div>
      </div>
    </InfoSection>
  );
}

// ===== Outlets Section =====

function OutletsSection({ business }: { business: Business }) {
  if (!business.outlets?.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada outlet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <InfoSection title={`Daftar Outlet (${business.outlets.length})`} icon={<MapPin className="h-4 w-4" />}>
      <div className="space-y-2">
        {business.outlets.map((outlet) => (
          <div key={outlet.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{outlet.name}</p>
                {outlet.isOpen !== undefined && (
                  <Badge variant="outline" className={outlet.isOpen ? 'text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'text-[10px] bg-muted text-muted-foreground'}>
                    {outlet.isOpen ? 'Buka' : 'Tutup'}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{outlet.address || 'Tidak ada alamat'}</p>
            </div>
            {outlet._count?.orders !== undefined && (
              <span className="text-[10px] text-muted-foreground shrink-0">{outlet._count.orders} order</span>
            )}
          </div>
        ))}
      </div>
    </InfoSection>
  );
}

// ===== Activity Section =====

function ActivitySection({ businessId }: { businessId: string }) {
  const { data: activities, isLoading } = useBusinessActivity(businessId, 15);

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (!activities?.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada aktivitas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <InfoSection title="Aktivitas Terbaru" icon={<Activity className="h-4 w-4" />}>
      <div className="space-y-1.5">
        {activities.map((act, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5">
            <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${act.type === 'order' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {act.type === 'order' ? <Package className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {act.type === 'order' ? `Order #${act.data.id?.slice(0, 8)}` : `Invoice #${act.data.invoiceNumber}`}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {act.type === 'order' ? `${act.data.outlet?.name || 'Outlet'} · ${formatCurrency(act.data.totalAmount)}` : `${formatCurrency(act.data.amount)} · ${act.data.status}`}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(act.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </InfoSection>
  );
}

// ===== Health Section =====

function HealthSection({ businessId }: { businessId: string }) {
  const { data: health, isLoading } = useBusinessHealthScore(businessId);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!health) return <Card><CardContent className="py-8 text-center text-muted-foreground">Gagal memuat health score</CardContent></Card>;

  const LEVEL_COLORS: Record<string, string> = {
    excellent: 'bg-emerald-500',
    good: 'bg-primary',
    fair: 'bg-yellow-500',
    poor: 'bg-orange-500',
    critical: 'bg-destructive',
  };

  const LEVEL_LABELS: Record<string, string> = {
    excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', critical: 'Critical',
  };

  const LABEL_MAP: Record<string, string> = {
    subscription: 'Langganan', activity: 'Aktivitas', revenue: 'Pendapatan', outlets: 'Outlet & Setup',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Health Score</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold">{health.score}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs px-3 py-1">
              {LEVEL_LABELS[health.level]}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${LEVEL_COLORS[health.level]}`} style={{ width: `${health.score}%` }} />
          </div>
        </CardContent>
      </Card>

      {Object.entries(health.breakdown).map(([key, val]) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">{LABEL_MAP[key] || key}</span>
              <span className="text-xs font-mono text-muted-foreground">{val.score}/{val.max}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(val.score / val.max) * 100}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{val.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== Notification Section =====

function NotificationSection({ business }: { business: Business }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [channels, setChannels] = useState<string[]>(['in_app']);
  const sendNotification = useSendNotification();

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject dan pesan wajib diisi');
      return;
    }
    sendNotification.mutate(
      { businessId: business.id, subject, message, type, channels },
      { onSuccess: () => { setSubject(''); setMessage(''); } },
    );
  };

  return (
    <InfoSection title="Kirim Notifikasi" icon={<Bell className="h-4 w-4" />}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Judul notifikasi" className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Pesan</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Isi pesan" rows={3} className="text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Peringatan</SelectItem>
                <SelectItem value="success">Sukses</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Channel</Label>
            <div className="flex gap-1.5">
              {['in_app', 'email'].map((ch) => (
                <Button
                  key={ch}
                  variant={channels.includes(ch) ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9 text-[11px]"
                  onClick={() => setChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch])}
                >
                  {ch === 'in_app' ? 'In-App' : 'Email'}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={handleSend} disabled={sendNotification.isPending} size="sm" className="w-full gap-1.5">
          {sendNotification.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Kirim
        </Button>
      </div>
    </InfoSection>
  );
}

// ===== Settings Section =====

function SettingsSection({ businessId }: { businessId: string }) {
  const { data: settings, isLoading } = useBusinessSettings(businessId);
  const updateSettings = useUpdateBusinessSettings();
  const [local, setLocal] = useState<any>(null);

  React.useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  if (isLoading || !local) return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <InfoSection title="Pengaturan Bisnis" icon={<Settings className="h-4 w-4" />}>
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground">Override batasan default plan. Kosongkan = gunakan default.</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'customOutletLimit', label: 'Max Outlet' },
            { key: 'customProductLimit', label: 'Max Produk' },
            { key: 'customStaffLimit', label: 'Max Staff' },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-[10px]">{field.label}</Label>
              <Input
                type="number"
                value={local[field.key] || ''}
                onChange={(e) => setLocal({ ...local, [field.key]: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Default"
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Catatan Admin</Label>
          <Textarea
            value={local.notes || ''}
            onChange={(e) => setLocal({ ...local, notes: e.target.value })}
            placeholder="Catatan internal"
            rows={2}
            className="text-xs"
          />
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => updateSettings.mutate({ businessId, settings: local })}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
          Simpan Pengaturan
        </Button>
      </div>
    </InfoSection>
  );
}
