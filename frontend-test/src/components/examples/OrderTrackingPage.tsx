'use client';

import React, { useEffect, useState } from 'react';
import { useOrderEvents, useNotifications, useConnectionStatus } from '@/hooks/useSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface OrderStatus {
    orderId: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    message?: string;
    updatedAt?: Date;
}

interface OrderTrackingPageProps {
    orderId: string;
}

export function OrderTrackingPage({ orderId }: OrderTrackingPageProps) {
    const [orderStatus, setOrderStatus] = useState<OrderStatus>({
        orderId,
        status: 'pending',
    });
    const [statusHistory, setStatusHistory] = useState<Array<{
        status: string;
        message?: string;
        timestamp: Date;
    }>>([]);

    // Socket hooks
    const { subscribeToOrderUpdates, trackOrder } = useOrderEvents();
    const { notifications, subscribeToNotifications } = useNotifications();
    const { isConnected, isConnecting, retry } = useConnectionStatus();

    // Subscribe to order updates
    useEffect(() => {
        const unsubscribe = subscribeToOrderUpdates(orderId, (data) => {
            console.log('Order update received:', data);

            setOrderStatus(prev => ({
                ...prev,
                status: data.status,
                message: data.message,
                updatedAt: new Date(),
            }));

            // Add to history
            setStatusHistory(prev => [
                {
                    status: data.status,
                    message: data.message,
                    timestamp: new Date(),
                },
                ...prev,
            ]);
        });

        return unsubscribe;
    }, [orderId, subscribeToOrderUpdates]);

    // Subscribe to general notifications
    useEffect(() => {
        const unsubscribe = subscribeToNotifications((notification) => {
            console.log('Notification received:', notification);
        });

        return unsubscribe;
    }, [subscribeToNotifications]);

    // Track order on component mount
    useEffect(() => {
        if (isConnected) {
            trackOrder(orderId);
        }
    }, [orderId, trackOrder, isConnected]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'cancelled':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-500';
            case 'confirmed':
                return 'bg-blue-500';
            case 'preparing':
                return 'bg-yellow-500';
            case 'ready':
                return 'bg-orange-500';
            case 'completed':
                return 'bg-green-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                    {isConnected ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                        {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                {!isConnected && !isConnecting && (
                    <Button onClick={retry} size="sm" variant="outline">
                        Reconnect
                    </Button>
                )}
            </div>

            {/* Order Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(orderStatus.status)}
                        <span>Order #{orderId}</span>
                    </CardTitle>
                    <CardDescription>
                        Current Status:
                        <Badge className={`ml-2 ${getStatusColor(orderStatus.status)}`}>
                            {orderStatus.status.toUpperCase()}
                        </Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {orderStatus.message && (
                        <p className="text-sm text-gray-600 mb-4">
                            {orderStatus.message}
                        </p>
                    )}
                    {orderStatus.updatedAt && (
                        <p className="text-xs text-gray-500">
                            Last updated: {orderStatus.updatedAt.toLocaleString()}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Status History */}
            {statusHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Order Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {statusHistory.map((entry, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                                    {getStatusIcon(entry.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <Badge className={getStatusColor(entry.status)}>
                                                {entry.status.toUpperCase()}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {entry.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {entry.message && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {entry.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Real-time Notifications */}
            {notifications.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Live Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {notifications.slice(0, 5).map((notification, index) => (
                                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="font-medium text-sm">{notification.title}</div>
                                    <div className="text-sm text-gray-600">{notification.message}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default OrderTrackingPage;
