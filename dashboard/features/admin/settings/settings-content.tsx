'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePlatformSettings, useUpdatePlatformSettings, PlatformSettingValue } from '@/lib/apis/admin-settings';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, Building2, CreditCard, Bell, Shield, Loader2 } from 'lucide-react';

export function SettingsContent() {
  const { data: settings, isLoading, refetch, isRefetching } = usePlatformSettings();
  const updateMutation = useUpdatePlatformSettings();

  const [form, setForm] = useState<PlatformSettingValue>({
    platform: { name: '', version: '', maintenanceMode: false },
    fees: { appFeePercent: 0, midtransFeePercent: 0, minimumWithdrawal: 0 },
    notifications: { whatsappEnabled: true, emailEnabled: true, pushEnabled: true },
    limits: { maxBusinessesPerOwner: 0, maxOutletsPerBusiness: 0, maxProductsPerOutlet: 0 },
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const updatePlatform = (key: keyof PlatformSettingValue['platform'], value: any) => {
    setForm(prev => ({
      ...prev,
      platform: { ...prev.platform, [key]: value },
    }));
  };

  const updateFees = (key: keyof PlatformSettingValue['fees'], value: number) => {
    setForm(prev => ({
      ...prev,
      fees: { ...prev.fees, [key]: value },
    }));
  };

  const updateNotifications = (key: keyof PlatformSettingValue['notifications'], value: boolean) => {
    setForm(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateLimits = (key: keyof PlatformSettingValue['limits'], value: number) => {
    setForm(prev => ({
      ...prev,
      limits: { ...prev.limits, [key]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Platform Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola konfigurasi platform</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola konfigurasi platform BOSS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan
          </Button>
        </div>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Informasi Platform</CardTitle>
              <CardDescription>Konfigurasi dasar platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platformName">Nama Platform</Label>
              <Input
                id="platformName"
                value={form.platform.name}
                onChange={(e) => updatePlatform('name', e.target.value)}
                placeholder="BOSS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformVersion">Versi</Label>
              <Input
                id="platformVersion"
                value={form.platform.version}
                onChange={(e) => updatePlatform('version', e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan mode maintenance untuk menonaktifkan sementara akses user
              </p>
            </div>
            <Switch
              checked={form.platform.maintenanceMode}
              onCheckedChange={(checked) => updatePlatform('maintenanceMode', checked)}
            />
          </div>
          {form.platform.maintenanceMode && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">
                  Maintenance mode aktif - User tidak dapat mengakses platform
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Konfigurasi Biaya</CardTitle>
              <CardDescription>Atur biaya layanan dan transaksi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="appFee">App Fee (%)</Label>
              <Input
                id="appFee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.fees.appFeePercent}
                onChange={(e) => updateFees('appFeePercent', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Biaya aplikasi per transaksi</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="midtransFee">Midtrans Fee (%)</Label>
              <Input
                id="midtransFee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.fees.midtransFeePercent}
                onChange={(e) => updateFees('midtransFeePercent', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Biaya payment gateway</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minWithdrawal">Minimum Withdrawal (Rp)</Label>
              <Input
                id="minWithdrawal"
                type="number"
                min="0"
                step="1000"
                value={form.fees.minimumWithdrawal}
                onChange={(e) => updateFees('minimumWithdrawal', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Minimal penarikan dana</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>Atur channel notifikasi yang aktif</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>WhatsApp Notifications</Label>
              <p className="text-sm text-muted-foreground">Kirim notifikasi via WhatsApp</p>
            </div>
            <Switch
              checked={form.notifications.whatsappEnabled}
              onCheckedChange={(checked) => updateNotifications('whatsappEnabled', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Kirim notifikasi via email</p>
            </div>
            <Switch
              checked={form.notifications.emailEnabled}
              onCheckedChange={(checked) => updateNotifications('emailEnabled', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Kirim push notification ke browser</p>
            </div>
            <Switch
              checked={form.notifications.pushEnabled}
              onCheckedChange={(checked) => updateNotifications('pushEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Batas Platform</CardTitle>
              <CardDescription>Atur batasan resource per user/bisnis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="maxBusiness">Max Bisnis per Owner</Label>
              <Input
                id="maxBusiness"
                type="number"
                min="1"
                value={form.limits.maxBusinessesPerOwner}
                onChange={(e) => updateLimits('maxBusinessesPerOwner', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Jumlah maksimal bisnis yang bisa dibuat</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOutlet">Max Outlet per Bisnis</Label>
              <Input
                id="maxOutlet"
                type="number"
                min="1"
                value={form.limits.maxOutletsPerBusiness}
                onChange={(e) => updateLimits('maxOutletsPerBusiness', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Jumlah maksimal outlet per bisnis</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxProduct">Max Produk per Outlet</Label>
              <Input
                id="maxProduct"
                type="number"
                min="1"
                value={form.limits.maxProductsPerOutlet}
                onChange={(e) => updateLimits('maxProductsPerOutlet', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Jumlah maksimal produk per outlet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
