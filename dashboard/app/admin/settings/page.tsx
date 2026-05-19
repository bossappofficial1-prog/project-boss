'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Settings,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    DollarSign,
    Bell,
    Shield,
    Globe,
    Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/apis/base';
import { toast } from 'sonner';

interface PlatformSettings {
    platform: {
        name: string;
        version: string;
        maintenance: boolean;
    };
    fees: {
        appFeePercentage: number;
        midtransFee: number;
        minimumWithdrawal: number;
    };
    notifications: {
        whatsappEnabled: boolean;
        emailEnabled: boolean;
    };
    limits: {
        maxBusinessesPerOwner: number;
        maxOutletsPerBusiness: number;
        maxProductsPerOutlet: number;
    };
}

export default function AdminSettings() {
    const queryClient = useQueryClient();

    const [settings, setSettings] = useState<PlatformSettings>({
        platform: {
            name: 'Project Boss',
            version: '1.0.0',
            maintenance: false,
        },
        fees: {
            appFeePercentage: 2.0,
            midtransFee: 4000,
            minimumWithdrawal: 50000,
        },
        notifications: {
            whatsappEnabled: true,
            emailEnabled: true,
        },
        limits: {
            maxBusinessesPerOwner: 5,
            maxOutletsPerBusiness: 10,
            maxProductsPerOutlet: 100,
        },
    });

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['platform-settings'],
        queryFn: async () => {
            const response = await apiClient.get('/admin/settings');
            return response.data.data;
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: PlatformSettings) => {
            const response = await apiClient.put('/admin/settings', { settings: newSettings });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
            toast.success('Settings saved successfully');
        },
        onError: () => {
            toast.error('Failed to save settings');
        },
    });

    React.useEffect(() => {
        if (settingsData) {
            setSettings(settingsData);
        }
    }, [settingsData]);

    const handleSave = async () => {
        await updateSettingsMutation.mutateAsync(settings);
    };

    const handleInputChange = (section: keyof PlatformSettings, field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Platform Settings</h1>
                    <p className="text-muted-foreground text-sm mt-1">Configure your platform settings and preferences</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['platform-settings'] })}
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateSettingsMutation.isPending}
                        className="flex items-center space-x-2"
                    >
                        {updateSettingsMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                </div>
            </div>

            {/* Platform Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
                        <span>Platform Configuration</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Platform Name</label>
                            <Input
                                value={settings.platform.name}
                                onChange={(e) => handleInputChange('platform', 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Version</label>
                            <Input
                                value={settings.platform.version}
                                onChange={(e) => handleInputChange('platform', 'version', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Enable Maintenance Mode</p>
                            <p className="text-xs text-muted-foreground">Users will see a maintenance page when enabled</p>
                        </div>
                        <Switch
                            checked={settings.platform.maintenance}
                            onCheckedChange={(checked) => handleInputChange('platform', 'maintenance', checked)}
                        />
                    </div>

                    {settings.platform.maintenance && (
                        <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700 leading-snug">
                                Maintenance mode is enabled. Users will see a maintenance page.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fee Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5" />
                        <span>Fee Configuration</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">App Fee Percentage (%)</label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.fees.appFeePercentage}
                                onChange={(e) => handleInputChange('fees', 'appFeePercentage', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Midtrans Fee (IDR)</label>
                            <Input
                                type="number"
                                min="0"
                                value={settings.fees.midtransFee}
                                onChange={(e) => handleInputChange('fees', 'midtransFee', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Minimum Withdrawal (IDR)</label>
                            <Input
                                type="number"
                                min="0"
                                value={settings.fees.minimumWithdrawal}
                                onChange={(e) => handleInputChange('fees', 'minimumWithdrawal', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-foreground">
                                <p className="font-medium">Current Fee Structure:</p>
                                <p className="text-muted-foreground">App Fee: {settings.fees.appFeePercentage}% per transaction</p>
                                <p className="text-muted-foreground">Midtrans Fee: {formatCurrency(settings.fees.midtransFee)} per transaction</p>
                                <p className="text-muted-foreground">Minimum Withdrawal: {formatCurrency(settings.fees.minimumWithdrawal)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Bell className="w-5 h-5" />
                        <span>Notification Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">WhatsApp Notifications</p>
                                <p className="text-xs text-muted-foreground">Send order updates via WhatsApp</p>
                            </div>
                            <Switch
                                checked={settings.notifications.whatsappEnabled}
                                onCheckedChange={(checked) => handleInputChange('notifications', 'whatsappEnabled', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Email Notifications</p>
                                <p className="text-xs text-muted-foreground">Send order updates via email</p>
                            </div>
                            <Switch
                                checked={settings.notifications.emailEnabled}
                                onCheckedChange={(checked) => handleInputChange('notifications', 'emailEnabled', checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Limits */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>System Limits</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Businesses per Owner</label>
                            <Input
                                type="number"
                                min="1"
                                value={settings.limits.maxBusinessesPerOwner}
                                onChange={(e) => handleInputChange('limits', 'maxBusinessesPerOwner', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Outlets per Business</label>
                            <Input
                                type="number"
                                min="1"
                                value={settings.limits.maxOutletsPerBusiness}
                                onChange={(e) => handleInputChange('limits', 'maxOutletsPerBusiness', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Products per Outlet</label>
                            <Input
                                type="number"
                                min="1"
                                value={settings.limits.maxProductsPerOutlet}
                                onChange={(e) => handleInputChange('limits', 'maxProductsPerOutlet', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border border-border bg-muted/30 p-4">
                        <div className="flex items-start gap-2.5">
                            <Settings className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-foreground">
                                <p className="font-medium">Current Limits:</p>
                                <p className="text-muted-foreground">{settings.limits.maxBusinessesPerOwner} businesses per owner</p>
                                <p className="text-muted-foreground">{settings.limits.maxOutletsPerBusiness} outlets per business</p>
                                <p className="text-muted-foreground">{settings.limits.maxProductsPerOutlet} products per outlet</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
