'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from '@/context/SocketContext';

// Hook untuk Order Events
export const useOrderEvents = () => {
    const { on, off, emit } = useSocket();

    const subscribeToOrderUpdates = useCallback((orderId: string, callback: (data: any) => void) => {
        const eventName = 'order_status_updated' as const;

        const handler = (data: { orderId: string; status: string; message?: string }) => {
            if (data.orderId === orderId) {
                callback(data);
            }
        };

        on(eventName, handler);

        // Return cleanup function
        return () => off(eventName, handler);
    }, [on, off]);

    const subscribeToOrderConfirmation = useCallback((callback: (data: any) => void) => {
        const eventName = 'order_confirmed' as const;
        on(eventName, callback);
        return () => off(eventName, callback);
    }, [on, off]);

    const subscribeToOrderReady = useCallback((callback: (data: any) => void) => {
        const eventName = 'order_ready' as const;
        on(eventName, callback);
        return () => off(eventName, callback);
    }, [on, off]);

    const subscribeToOrderCancelled = useCallback((callback: (data: any) => void) => {
        const eventName = 'order_cancelled' as const;
        on(eventName, callback);
        return () => off(eventName, callback);
    }, [on, off]);

    // const trackOrder = useCallback((orderId: string) => {
    //     emit('track_order', { orderId });
    // }, [emit]);

    return {
        subscribeToOrderUpdates,
        subscribeToOrderConfirmation,
        subscribeToOrderReady,
        subscribeToOrderCancelled,
        // trackOrder,
    };
};

// Hook untuk Notifications
export const useNotifications = () => {
    const { on, off } = useSocket();
    const [notifications, setNotifications] = useState<any[]>([]);

    const subscribeToNotifications = useCallback((callback?: (data: any) => void) => {
        const eventName = 'notification' as const;

        const handler = (data: { type: string; title: string; message: string; data?: any }) => {
            // Add to local state
            setNotifications(prev => [data, ...prev]);

            // Call custom callback if provided
            if (callback) {
                callback(data);
            }
        };

        on(eventName, handler);

        return () => off(eventName, handler);
    }, [on, off]);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((index: number) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);

    return {
        notifications,
        subscribeToNotifications,
        clearNotifications,
        removeNotification,
    };
};

// Hook untuk Outlet Events
export const useOutletEvents = () => {
    const { on, off, emit, joinRoom, leaveRoom } = useSocket();

    const subscribeToOutletUpdates = useCallback((outletId: string, callback: (data: any) => void) => {
        // Join outlet room for real-time updates
        joinRoom(`outlet_${outletId}`);

        const statusHandler = (data: { outletId: string; isOpen: boolean; reason?: string }) => {
            if (data.outletId === outletId) {
                callback({ type: 'status_changed', ...data });
            }
        };

        const busyHandler = (data: { outletId: string; estimatedWaitTime: number }) => {
            if (data.outletId === outletId) {
                callback({ type: 'busy_status', ...data });
            }
        };

        on('outlet_status_changed', statusHandler);
        on('outlet_busy', busyHandler);

        return () => {
            off('outlet_status_changed', statusHandler);
            off('outlet_busy', busyHandler);
            leaveRoom(`outlet_${outletId}`);
        };
    }, [on, off, joinRoom, leaveRoom]);

    // const requestOutletStatus = useCallback((outletId: string) => {
    //     emit('get_outlet_status', { outletId });
    // }, [emit]);

    return {
        subscribeToOutletUpdates,
        // requestOutletStatus,
    };
};

// Hook untuk Real-time Location Updates
export const useLocationTracking = () => {
    const { emit } = useSocket();
    const [isTracking, setIsTracking] = useState(false);

    const startLocationTracking = useCallback((orderId: string) => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser');
            return;
        }

        setIsTracking(true);

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // emit('location_update', {
                //     orderId,
                //     latitude,
                //     longitude,
                //     timestamp: Date.now(),
                // });
            },
            (error) => {
                console.error('Location tracking error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            setIsTracking(false);
        };
    }, [emit]);

    return {
        isTracking,
        startLocationTracking,
    };
};

// Hook untuk Connection Status
export const useConnectionStatus = () => {
    const { isConnected, isConnecting, error, connect, disconnect } = useSocket();
    const [connectionHistory, setConnectionHistory] = useState<Array<{
        status: 'connected' | 'disconnected' | 'error';
        timestamp: Date;
        message?: string;
    }>>([]);

    useEffect(() => {
        const status = isConnected ? 'connected' : 'disconnected';
        const entry: {
            status: 'connected' | 'disconnected' | 'error';
            timestamp: Date;
            message?: string;
        } = {
            status,
            timestamp: new Date(),
            message: error || undefined,
        };

        setConnectionHistory(prev => [entry, ...prev.slice(0, 9)]); // Keep last 10 entries
    }, [isConnected, error]);

    const retry = useCallback(() => {
        if (!isConnected && !isConnecting) {
            connect();
        }
    }, [isConnected, isConnecting, connect]);

    return {
        isConnected,
        isConnecting,
        error,
        connectionHistory,
        retry,
        disconnect,
    };
};

// Hook untuk Custom Event Listeners
export const useSocketEvent = <T>(eventName: string, callback: (data: T) => void, deps: any[] = []) => {
    const { on, off } = useSocket();

    useEffect(() => {
        on(eventName as any, callback);

        return () => {
            off(eventName as any, callback);
        };
    }, deps);
};

// Hook untuk Room Management
export const useSocketRoom = (roomName: string, autoJoin: boolean = true) => {
    const { joinRoom, leaveRoom, isConnected } = useSocket();
    const [isInRoom, setIsInRoom] = useState(false);

    const join = useCallback(() => {
        if (isConnected) {
            joinRoom(roomName);
            setIsInRoom(true);
        }
    }, [roomName, joinRoom, isConnected]);

    const leave = useCallback(() => {
        if (isConnected) {
            leaveRoom(roomName);
            setIsInRoom(false);
        }
    }, [roomName, leaveRoom, isConnected]);

    useEffect(() => {
        if (autoJoin && isConnected) {
            join();
        }

        return () => {
            if (isInRoom) {
                leave();
            }
        };
    }, [isConnected, autoJoin]);

    return {
        isInRoom,
        join,
        leave,
    };
};
