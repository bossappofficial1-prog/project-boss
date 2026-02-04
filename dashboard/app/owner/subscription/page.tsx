'use client';

import React from 'react';
import { useSubscriptionStatus, useRenewSubscription } from '@/hooks/useSubscription';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, CheckCircle, Clock, CreditCard, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SubscriptionPage() {
    const { data: subscriptionStatus, isLoading: loadingStatus } = useSubscriptionStatus();
    const { data: plans, isLoading: loadingPlans } = useSubscriptionPlans();
    const { mutate: renewSubscription, isPending: isRenewing } = useRenewSubscription();

    const getDaysUntilExpiry = () => {
        if (!subscriptionStatus?.subscription?.endDate) return null;
        const endDate = new Date(subscriptionStatus.subscription.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'TRIAL':
                return 'bg-green-500';
            case 'EXPIRED':
                return 'bg-red-500';
            case 'AWAITING_PAYMENT':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Aktif';
            case 'TRIAL':
                return 'Trial';
            case 'EXPIRED':
                return 'Expired';
            case 'AWAITING_PAYMENT':
                return 'Menunggu Pembayaran';
            default:
                return status;
        }
    };

    const handleRenew = (planCode?: string) => {
        renewSubscription(planCode);
    };

    const daysUntilExpiry = getDaysUntilExpiry();
    const showExpiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

    if (loadingStatus || loadingPlans) {
        return (
            <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    const currentPlan = subscriptionStatus?.subscription?.plan;
    const features = currentPlan?.features as any;

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Subscription Management</h1>
                    <p className="text-muted-foreground">Kelola langganan dan paket Anda</p>
                </div>
            </div>

            {/* Expiry Warning */}
            {showExpiryWarning && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Langganan Anda Akan Berakhir</AlertTitle>
                    <AlertDescription>
                        Langganan Anda akan berakhir dalam {daysUntilExpiry} hari. Perpanjang sekarang untuk menghindari gangguan layanan.
                    </AlertDescription>
                </Alert>
            )}

            {/* Current Subscription */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Paket Saat Ini</CardTitle>
                            <CardDescription>Status langganan Anda</CardDescription>
                        </div>
                        <Badge className={getStatusColor(subscriptionStatus?.business?.subscriptionStatus || '')}>
                            {getStatusLabel(subscriptionStatus?.business?.subscriptionStatus || '')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Paket</p>
                                    <p className="font-semibold">{currentPlan?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Harga</p>
                                    <p className="font-semibold">{formatCurrency(currentPlan?.price || 0)} / {currentPlan?.durationDays || 0} hari</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Mulai</p>
                                    <p className="font-semibold">
                                        {subscriptionStatus?.subscription?.startDate
                                            ? new Date(subscriptionStatus.subscription.startDate).toLocaleDateString('id-ID')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Berakhir</p>
                                    <p className="font-semibold">
                                        {subscriptionStatus?.subscription?.endDate
                                            ? new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('id-ID')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    {features && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-3">Fitur Paket</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">
                                        {features.maxOutlets === -1 ? 'Unlimited' : features.maxOutlets} Outlet
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">
                                        {features.maxProducts === -1 ? 'Unlimited' : features.maxProducts} Produk
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">
                                        {features.maxStaff === -1 ? 'Unlimited' : features.maxStaff} Staff
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {features.canExportReport ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="text-sm">Export Laporan</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">{features.supportLevel} Support</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Renew Button */}
                    <div className="pt-4">
                        <Button 
                            onClick={() => handleRenew()} 
                            disabled={isRenewing}
                            size="lg"
                        >
                            {isRenewing ? 'Processing...' : 'Perpanjang Langganan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Available Plans */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Paket yang Tersedia</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans?.map((plan) => {
                        const planFeatures = plan.features as any;
                        const isCurrentPlan = plan.code === currentPlan?.code;
                        
                        return (
                            <Card key={plan.id} className={isCurrentPlan ? 'border-primary' : ''}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{plan.name}</CardTitle>
                                        {isCurrentPlan && (
                                            <Badge variant="secondary">Current</Badge>
                                        )}
                                    </div>
                                    <CardDescription className="text-2xl font-bold">
                                        {formatCurrency(plan.price)}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {' '}/ {plan.durationDays} hari
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            {planFeatures.maxOutlets === -1 ? 'Unlimited' : planFeatures.maxOutlets} Outlet
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            {planFeatures.maxProducts === -1 ? 'Unlimited' : planFeatures.maxProducts} Produk
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            {planFeatures.maxStaff === -1 ? 'Unlimited' : planFeatures.maxStaff} Staff
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {planFeatures.canExportReport ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-gray-400" />
                                            )}
                                            Export Laporan
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            {planFeatures.supportLevel} Support
                                        </div>
                                    </div>
                                    
                                    {!isCurrentPlan && (
                                        <Button
                                            className="w-full"
                                            variant={plan.isPopular ? "default" : "outline"}
                                            onClick={() => handleRenew(plan.code)}
                                            disabled={isRenewing}
                                        >
                                            {plan.code === 'TRIAL' ? 'Mulai Trial' : 'Pilih Paket'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Invoice History */}
            {subscriptionStatus?.invoices && subscriptionStatus.invoices.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Invoice</CardTitle>
                        <CardDescription>Daftar invoice langganan Anda</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {subscriptionStatus.invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                                        <Badge
                                            variant={invoice.status === 'SUCCESS' ? 'default' : 'secondary'}
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
