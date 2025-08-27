'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Receipt,
    Clock,
    CheckCircle,
    ChefHat,
    Package,
    XCircle,
    Eye,
    Phone,
    MessageCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderData } from './OrdersPage';
import OrderDetailModal from './OrderDetailModal';

interface OrderCardProps {
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

export default function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
    const [showDetail, setShowDetail] = useState(false);
    const router = useRouter();
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    const handleContactOutlet = () => {
        // In a real app, this would contact the specific outlet
        alert('Fitur hubungi outlet akan segera hadir');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const primaryOutlet = order.checkoutData.outlets[0];

    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                    {order.orderNumber || `ORD-${order.id.slice(-6)}`}
                                </span>
                            </div>
                            <h3 className="font-semibold text-base">
                                {primaryOutlet.outletName}
                                {order.checkoutData.outlets.length > 1 &&
                                    ` +${order.checkoutData.outlets.length - 1} outlet lainnya`
                                }
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(order.paymentDate)}
                            </p>
                        </div>

                        <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Status Description */}
                    <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                            {statusConfig.description}
                        </p>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Pesanan</span>
                            <span className="font-semibold">
                                {formatCurrency(order.checkoutData.grandTotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Metode Pembayaran</span>
                            <span>{order.selectedPaymentMethod.name}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowDetail(true)}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Detail
                        </Button>

                        {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleContactOutlet}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Hubungi
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <OrderDetailModal
                open={showDetail}
                onOpenChange={setShowDetail}
                order={order}
                onStatusUpdate={onStatusUpdate}
            />
        </>
    );
}
