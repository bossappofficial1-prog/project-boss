'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    DollarSign,
    Bell,
    Shield,
    Globe
} from 'lucide-react';
import { apiClient } from '@/lib/apis/base';

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

    // Fetch current settings
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['platform-settings'],
        queryFn: async () => {
            const response = await apiClient.get('/admin/settings');
            return response.data;
        },
    });

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: PlatformSettings) => {
            const response = await apiClient.put('/admin/settings', { settings: newSettings });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
        },
    });

    // Update local state when data is fetched
    React.useEffect(() => {
        if (settingsData?.data) {
            setSettings(settingsData.data);
        }
    }, [settingsData]);

    const handleSave = async () => {
        try {
            await updateSettingsMutation.mutateAsync(settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                    <p className="text-gray-600 mt-1">Configure your platform settings and preferences</p>
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
                        <Save className="w-4 h-4" />
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Platform Name
                            </label>
                            <input
                                type="text"
                                value={settings.platform.name}
                                onChange={(e) => handleInputChange('platform', 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Version
                            </label>
                            <input
                                type="text"
                                value={settings.platform.version}
                                onChange={(e) => handleInputChange('platform', 'version', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="maintenance"
                            checked={settings.platform.maintenance}
                            onChange={(e) => handleInputChange('platform', 'maintenance', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">
                            Enable Maintenance Mode
                        </label>
                    </div>

                    {settings.platform.maintenance && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm text-yellow-800">
                                    Maintenance mode is enabled. Users will see a maintenance page.
                                </span>
                            </div>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                App Fee Percentage (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.fees.appFeePercentage}
                                onChange={(e) => handleInputChange('fees', 'appFeePercentage', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Midtrans Fee (IDR)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={settings.fees.midtransFee}
                                onChange={(e) => handleInputChange('fees', 'midtransFee', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Withdrawal (IDR)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={settings.fees.minimumWithdrawal}
                                onChange={(e) => handleInputChange('fees', 'minimumWithdrawal', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">Current Fee Structure:</p>
                                <p>• App Fee: {settings.fees.appFeePercentage}% per transaction</p>
                                <p>• Midtrans Fee: {formatCurrency(settings.fees.midtransFee)} per transaction</p>
                                <p>• Minimum Withdrawal: {formatCurrency(settings.fees.minimumWithdrawal)}</p>
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
                                <h4 className="text-sm font-medium text-gray-900">WhatsApp Notifications</h4>
                                <p className="text-sm text-gray-600">Send order updates via WhatsApp</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.whatsappEnabled}
                                    onChange={(e) => handleInputChange('notifications', 'whatsappEnabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                                <p className="text-sm text-gray-600">Send order updates via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.emailEnabled}
                                    onChange={(e) => handleInputChange('notifications', 'emailEnabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Businesses per Owner
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={settings.limits.maxBusinessesPerOwner}
                                onChange={(e) => handleInputChange('limits', 'maxBusinessesPerOwner', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Outlets per Business
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={settings.limits.maxOutletsPerBusiness}
                                onChange={(e) => handleInputChange('limits', 'maxOutletsPerBusiness', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Products per Outlet
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={settings.limits.maxProductsPerOutlet}
                                onChange={(e) => handleInputChange('limits', 'maxProductsPerOutlet', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <Settings className="w-5 h-5 text-gray-600" />
                            <div className="text-sm text-gray-700">
                                <p className="font-medium">Current Limits:</p>
                                <p>• {settings.limits.maxBusinessesPerOwner} businesses per owner</p>
                                <p>• {settings.limits.maxOutletsPerBusiness} outlets per business</p>
                                <p>• {settings.limits.maxProductsPerOutlet} products per outlet</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Status */}
            {updateSettingsMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800">
                            Settings saved successfully!
                        </span>
                    </div>
                </div>
            )}

            {updateSettingsMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-800">
                            Failed to save settings. Please try again.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}