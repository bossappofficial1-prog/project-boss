'use client'

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Receipt,
    User,
    Phone,
    CreditCard,
    Store,
    Calendar,
    Clock,
    CheckCircle,
    ChefHat,
    Package,
    XCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderData } from './OrdersPage';

interface OrderDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OrderData;
    onStatusUpdate: (orderId: string, newStatus: OrderData['status']) => void;
}

const getStatusConfig = (status: OrderData['status']) => {
    switch (status) {
        case 'pending':
            return {
                label: 'Menunggu Konfirmasi',
                color: 'bg-yellow-500 text-white',
                icon: Clock,
                description: 'Outlet sedang memproses pesanan Anda'
            };
        case 'confirmed':
            return {
                label: 'Pesanan Dikonfirmasi',
                color: 'bg-blue-500 text-white',
                icon: CheckCircle,
                description: 'Pesanan telah dikonfirmasi dan sedang dipersiapkan'
            };
        case 'preparing':
            return {
                label: 'Sedang Dipersiapkan',
                color: 'bg-orange-500 text-white',
                icon: ChefHat,
                description: 'Pesanan sedang dipersiapkan'
            };
        case 'ready':
            return {
                label: 'Siap Diambil',
                color: 'bg-green-500 text-white',
                icon: Package,
                description: 'Pesanan siap untuk diambil'
            };
        case 'completed':
            return {
                label: 'Selesai',
                color: 'bg-emerald-500 text-white',
                icon: CheckCircle,
                description: 'Pesanan telah selesai'
            };
        case 'cancelled':
            return {
                label: 'Dibatalkan',
                color: 'bg-red-500 text-white',
                icon: XCircle,
                description: 'Pesanan telah dibatalkan'
            };
        default:
            return {
                label: 'Status Tidak Diketahui',
                color: 'bg-gray-500 text-white',
                icon: Clock,
                description: ''
            };
    }
};

export default function OrderDetailModal({
    open,
    onOpenChange,
    order,
    onStatusUpdate
}: OrderDetailModalProps) {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Demo function to simulate status updates
    const handleStatusUpdate = (newStatus: OrderData['status']) => {
        onStatusUpdate(order.id, newStatus);
        // In a real app, this would make an API call
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Detail Pesanan
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Order Status */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Status Pesanan</CardTitle>
                                <Badge className={statusConfig.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig.label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {statusConfig.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Order Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="w-5 h-5" />
                                Informasi Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nomor Pesanan</span>
                                <span className="font-medium">
                                    {order.orderNumber || `ORD-${order.id.slice(-6)}`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tanggal Pemesanan</span>
                                <span className="font-medium">{formatDate(order.paymentDate)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Informasi Pembeli
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nama</span>
                                <span className="font-medium">{order.customerInfo.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">No. Telepon</span>
                                <span className="font-medium">{order.customerInfo.phone}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Outlet Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Store className="w-5 h-5" />
                                Detail Outlet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.checkoutData.outlets.map((outlet, index) => (
                                <div key={index} className="space-y-2">
                                    <h4 className="font-semibold">{outlet.outletName}</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{formatCurrency(outlet.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Biaya Transaksi</span>
                                            <span>{formatCurrency(outlet.transactionFee)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Biaya Aplikasi</span>
                                            <span>{formatCurrency(outlet.applicationFee)}</span>
                                        </div>
                                    </div>
                                    {index < order.checkoutData.outlets.length - 1 && <Separator />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Ringkasan Pembayaran
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(order.checkoutData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Biaya Transaksi</span>
                                <span>{formatCurrency(order.checkoutData.totalTransactionFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Biaya Aplikasi</span>
                                <span>{formatCurrency(order.checkoutData.applicationFee)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span className="text-primary">
                                    {formatCurrency(order.checkoutData.grandTotal)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Metode Pembayaran</span>
                                <span>{order.selectedPaymentMethod.name}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Demo Status Update Buttons (for testing) */}
                    {process.env.NODE_ENV === 'development' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm text-muted-foreground">
                                    Demo: Update Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('pending')}
                                    >
                                        Pending
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('confirmed')}
                                    >
                                        Confirmed
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('preparing')}
                                    >
                                        Preparing
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('ready')}
                                    >
                                        Ready
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusUpdate('completed')}
                                    >
                                        Completed
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
