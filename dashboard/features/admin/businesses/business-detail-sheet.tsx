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
  Mail,
  Shield,
  Clock,
  XCircle,
  Copy,
  Activity,
  Heart,
  Bell,
  Settings,
  Edit,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Send,
  Loader2,
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
  BusinessHealthScore,
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

  const isSuspended = business.subscriptionStatus === 'SUSPENDED';

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    ACTIVE: { label: 'Aktif', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    SUSPENDED: { label: 'Suspended', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
    TRIAL: { label: 'Trial', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <Clock className="h-3 w-3" /> },
    EXPIRED: { label: 'Expired', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <XCircle className="h-3 w-3" /> },
    AWAITING_PAYMENT: { label: 'Menunggu Bayar', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  };

  const statusInfo = statusConfig[business.subscriptionStatus] || statusConfig.ACTIVE;

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
        <SheetContent className="sm:max-w-2xl w-[95vw] overflow-y-auto p-0 gap-0">
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
                          {business.id.split('-')[0]}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {business.owner?.email}
                        </span>
                      </SheetDescription>
                      <div className="flex items-center gap-2 mt-2">
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
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant={isSuspended ? 'default' : 'outline'}
                    size="sm"
                    className={
                      isSuspended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'
                        : 'text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5'
                    }
                    onClick={handleSuspend}
                    disabled={isSuspendPending}
                  >
                    {isSuspended ? <><CheckCircle2 className="h-3.5 w-3.5" /> Aktifkan</> : <><Ban className="h-3.5 w-3.5" /> Suspend</>}
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
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6 h-auto flex-wrap">
                <TabsTrigger value="overview" className="gap-1.5 text-xs py-2">
                  <Building2 className="h-3.5 w-3.5" /> Profil
                </TabsTrigger>
                <TabsTrigger value="bank" className="gap-1.5 text-xs py-2">
                  <CreditCard className="h-3.5 w-3.5" /> Bank
                </TabsTrigger>
                <TabsTrigger value="outlets" className="gap-1.5 text-xs py-2">
                  <MapPin className="h-3.5 w-3.5" /> Outlet
                </TabsTrigger>
                <TabsTrigger value="health" className="gap-1.5 text-xs py-2">
                  <Heart className="h-3.5 w-3.5" /> Health
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5 text-xs py-2">
                  <Activity className="h-3.5 w-3.5" /> Aktivitas
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-1.5 text-xs py-2">
                  <Package className="h-3.5 w-3.5" /> Langganan
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-1.5 text-xs py-2">
                  <Bell className="h-3.5 w-3.5" /> Notifikasi
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs py-2">
                  <Settings className="h-3.5 w-3.5" /> Setting
                </TabsTrigger>
              </TabsList>

              {/* TAB: Overview */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                <OverviewTab business={business} />
              </TabsContent>

              {/* TAB: Bank */}
              <TabsContent value="bank" className="mt-0">
                <BankTab business={business} onCopy={handleCopy} copied={copied} />
              </TabsContent>

              {/* TAB: Outlets */}
              <TabsContent value="outlets" className="mt-0">
                <OutletsTab business={business} />
              </TabsContent>

              {/* TAB: Health Score */}
              <TabsContent value="health" className="mt-0">
                <HealthScoreTab businessId={business.id} />
              </TabsContent>

              {/* TAB: Activity */}
              <TabsContent value="activity" className="mt-0">
                <ActivityTab businessId={business.id} />
              </TabsContent>

              {/* TAB: Subscription */}
              <TabsContent value="subscription" className="mt-0">
                <SubscriptionTab business={business} />
              </TabsContent>

              {/* TAB: Notifications */}
              <TabsContent value="notifications" className="mt-0">
                <NotificationTab business={business} />
              </TabsContent>

              {/* TAB: Settings */}
              <TabsContent value="settings" className="mt-0">
                <SettingsTab businessId={business.id} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Bisnis"
        description={
          <span>
            Apakah Anda yakin ingin menghapus bisnis <strong>"{business.name}"</strong>? Tindakan ini
            permanen dan akan menghapus seluruh data terkait termasuk outlet, produk, dan transaksi.
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

// ===== Sub-components =====

function OverviewTab({ business }: { business: Business }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{business._count?.outlets || 0}</div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Outlet</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{business._count?.orders || 0}</div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Transaksi</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> Informasi Bisnis</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Nama" value={business.name} />
          <InfoRow label="Deskripsi" value={business.description || '~'} />
          <InfoRow label="Terdaftar" value={business.createdAt ? new Date(business.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Pemilik</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <Avatar className="h-9 w-9 border border-border"><AvatarFallback className="text-xs bg-muted">{business.owner?.name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{business.owner?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{business.owner?.email}</p>
            </div>
            {business.owner?.isVerified ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0"><Shield className="h-3 w-3 mr-1" /> Verified</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>
            )}
          </div>
          {business.owner?.phone && (
            <div className="flex items-center gap-3 p-2 rounded-lg">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center"><Phone className="h-4 w-4" /></div>
              <span className="text-sm">{business.owner.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function BankTab({ business, onCopy, copied }: { business: Business; onCopy: (text: string, label: string) => void; copied: string | null }) {
  return business.bankName ? (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /> Rekening Bank</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-md bg-background border border-border flex items-center justify-center"><CreditCard className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="font-semibold text-sm">{business.bankName}</p><p className="text-xs text-muted-foreground">Bank Account</p></div>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Nomor Rekening</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{business.bankAccount}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(business.bankAccount!, 'Nomor rekening')}>
                  {copied === 'Nomor rekening' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Atas Nama</span>
              <span className="text-sm font-medium">{business.accountHolder}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card><CardContent className="py-8"><div className="text-center text-muted-foreground"><CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Belum ada informasi rekening bank</p></div></CardContent></Card>
  );
}

function OutletsTab({ business }: { business: Business }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Daftar Outlet ({business.outlets?.length || 0})</h4>
      </div>
      {business.outlets && business.outlets.length > 0 ? business.outlets.map((outlet) => (
        <Card key={outlet.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{outlet.name}</p>
                  {outlet.isOpen !== undefined && (
                    <Badge variant="outline" className={outlet.isOpen ? 'text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'text-[10px] bg-muted text-muted-foreground'}>
                      {outlet.isOpen ? 'Buka' : 'Tutup'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{outlet.address || 'Tidak ada alamat'}</p>
                {outlet._count?.orders !== undefined && <p className="text-xs text-primary font-medium mt-1">{outlet._count.orders} Orders</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )) : (
        <Card><CardContent className="py-6"><div className="text-center text-muted-foreground"><MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" /><p className="text-xs">Belum ada outlet</p></div></CardContent></Card>
      )}
    </div>
  );
}

function HealthScoreTab({ businessId }: { businessId: string }) {
  const { data: health, isLoading } = useBusinessHealthScore(businessId);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!health) return <Card><CardContent className="py-8 text-center text-muted-foreground">Gagal memuat health score</CardContent></Card>;

  const levelColors: Record<string, { bg: string; text: string; border: string }> = {
    excellent: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
    good: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
    fair: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20' },
    poor: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
  };

  const levelLabels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',
  };

  const colors = levelColors[health.level];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{health.score}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} text-sm px-3 py-1`}>
              {levelLabels[health.level]}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                health.level === 'excellent' ? 'bg-emerald-500' :
                health.level === 'good' ? 'bg-blue-500' :
                health.level === 'fair' ? 'bg-yellow-500' :
                health.level === 'poor' ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {Object.entries(health.breakdown).map(([key, value]) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium capitalize">{key === 'subscription' ? 'Langganan' : key === 'activity' ? 'Aktivitas' : key === 'revenue' ? 'Pendapatan' : 'Outlet & Setup'}</span>
              <span className="text-sm font-mono font-semibold">{value.score}/{value.max}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${(value.score / value.max) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{value.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivityTab({ businessId }: { businessId: string }) {
  const { data: activities, isLoading } = useBusinessActivity(businessId, 30);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {activities && activities.length > 0 ? activities.map((activity, i) => (
        <Card key={i}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${activity.type === 'order' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                {activity.type === 'order' ? <Package className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {activity.type === 'order' ? `Order #${activity.data.id?.slice(0, 8)}` : `Invoice #${activity.data.invoiceNumber}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.type === 'order'
                    ? `${activity.data.outlet?.name || 'Outlet'} • ${formatCurrency(activity.data.totalAmount)}`
                    : `${formatCurrency(activity.data.amount)} • ${activity.data.status}`}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(activity.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </CardContent>
        </Card>
      )) : (
        <Card><CardContent className="py-8"><div className="text-center text-muted-foreground"><Activity className="h-6 w-6 mx-auto mb-2 opacity-50" /><p className="text-xs">Belum ada aktivitas</p></div></CardContent></Card>
      )}
    </div>
  );
}

function SubscriptionTab({ business }: { business: Business }) {
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extendDays, setExtendDays] = useState('30');
  const { data: subscription, isLoading } = useBusinessSubscription(business.id);
  const { data: plans } = useSubscriptionPlans();
  const changePlan = useChangeSubscriptionPlan();
  const extendSub = useExtendSubscription();
  const cancelSub = useCancelSubscription();

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /> Langganan Saat Ini</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Paket</span>
            <Badge variant="secondary" className="font-semibold">{business.subscriptionPlan || 'TRIAL'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="outline" className={
              business.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
              business.subscriptionStatus === 'SUSPENDED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
              'bg-muted text-muted-foreground'
            }>{business.subscriptionStatus}</Badge>
          </div>
          {business.subscriptionEndDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Berakhir</span>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(business.subscriptionEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Ubah Plan</CardTitle></CardHeader>
        <CardContent>
          <Select onValueChange={(planId) => changePlan.mutate({ businessId: business.id, planId })}>
            <SelectTrigger><SelectValue placeholder="Pilih plan baru" /></SelectTrigger>
            <SelectContent>
              {plans?.map((plan: any) => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name} - {formatCurrency(plan.price)}/bulan</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {changePlan.isPending && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Mengubah plan...</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Perpanjang Langganan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} placeholder="Jumlah hari" min="1" max="365" />
            <Button onClick={() => extendSub.mutate({ businessId: business.id, days: parseInt(extendDays) })} disabled={extendSub.isPending}>
              {extendSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Perpanjang'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-destructive">Batalkan Langganan</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Pembatalan akan menonaktifkan akses bisnis ke platform.</p>
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm" className="w-full">Batalkan Langganan</Button>}
            title="Batalkan Langganan"
            description={`Apakah Anda yakin ingin membatalkan langganan "${business.name}"?`}
            confirmLabel="Ya, Batalkan"
            confirmVariant="destructive"
            showInput
            inputPlaceholder="Alasan pembatalan..."
            onConfirm={(reason) => cancelSub.mutate({ businessId: business.id, reason: reason || 'Dibatalkan oleh admin' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationTab({ business }: { business: Business }) {
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
    sendNotification.mutate({
      businessId: business.id,
      subject,
      message,
      type,
      channels,
    }, {
      onSuccess: () => {
        setSubject('');
        setMessage('');
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /> Kirim Notifikasi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Judul notifikasi" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Pesan</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Isi pesan notifikasi" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Tipe</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Peringatan</SelectItem>
                  <SelectItem value="success">Sukses</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Channel</Label>
              <div className="flex gap-2">
                <Button
                  variant={channels.includes('in_app') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannels(prev => prev.includes('in_app') ? prev.filter(c => c !== 'in_app') : [...prev, 'in_app'])}
                  className="flex-1"
                >
                  In-App
                </Button>
                <Button
                  variant={channels.includes('email') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChannels(prev => prev.includes('email') ? prev.filter(c => c !== 'email') : [...prev, 'email'])}
                  className="flex-1"
                >
                  Email
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={handleSend} disabled={sendNotification.isPending} className="w-full gap-2">
            {sendNotification.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim Notifikasi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab({ businessId }: { businessId: string }) {
  const { data: settings, isLoading } = useBusinessSettings(businessId);
  const updateSettings = useUpdateBusinessSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);

  React.useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  if (isLoading || !localSettings) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const handleSave = () => {
    updateSettings.mutate({ businessId, settings: localSettings });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Settings className="h-4 w-4 text-muted-foreground" /> Custom Limits</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Override batasan default plan untuk bisnis ini. Kosongkan untuk menggunakan batasan plan.</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Max Outlet</Label>
              <Input type="number" value={localSettings.customOutletLimit || ''} onChange={(e) => setLocalSettings({ ...localSettings, customOutletLimit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Default" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max Produk</Label>
              <Input type="number" value={localSettings.customProductLimit || ''} onChange={(e) => setLocalSettings({ ...localSettings, customProductLimit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Default" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max Staff</Label>
              <Input type="number" value={localSettings.customStaffLimit || ''} onChange={(e) => setLocalSettings({ ...localSettings, customStaffLimit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Default" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Catatan Admin</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={localSettings.notes || ''} onChange={(e) => setLocalSettings({ ...localSettings, notes: e.target.value })} placeholder="Catatan internal tentang bisnis ini" rows={3} />
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full gap-2">
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </div>
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
