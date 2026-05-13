'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from './useSocket-v2';

// Hook untuk Order Events
export const useOrderEvents = () => {
    const { onEvent, joinOrderRoom } = useSocket();

    const subscribeToOrderUpdates = useCallback((orderId: string, callback: (data: any) => void) => {
        if (!orderId) {
            return () => undefined;
        }

        joinOrderRoom(orderId);

        const handler = (data: { orderId: string; status: string; message?: string }) => {
            if (data.orderId === orderId) {
                callback(data);
            }
        };

        const unsubscribe = onEvent('order_status_updated', handler);

        return () => {
            unsubscribe?.();
        };
    }, [joinOrderRoom, onEvent]);

    const subscribeToOrderConfirmation = useCallback((callback: (data: any) => void) => {
        return onEvent('order_confirmed', callback) ?? (() => undefined);
    }, [onEvent]);

    const subscribeToOrderReady = useCallback((callback: (data: any) => void) => {
        return onEvent('order_ready', callback) ?? (() => undefined);
    }, [onEvent]);

    const subscribeToOrderCancelled = useCallback((callback: (data: any) => void) => {
        return onEvent('order_cancelled', callback) ?? (() => undefined);
    }, [onEvent]);

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
    const { onEvent } = useSocket();
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

        const unsubscribe = onEvent(eventName, handler);

        return () => {
            unsubscribe?.();
        };
    }, [onEvent]);

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
    const { onEvent } = useSocket();

    const subscribeToOutletUpdates = useCallback((outletId: string, callback: (data: any) => void) => {
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

        const unsubscribeStatus = onEvent('outlet_status_changed', statusHandler);
        const unsubscribeBusy = onEvent('outlet_busy', busyHandler);

        return () => {
            unsubscribeStatus?.();
            unsubscribeBusy?.();
        };
    }, [onEvent]);

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
    const { emitEvent } = useSocket();
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
                emitEvent('location_update', {
                    orderId,
                    latitude,
                    longitude,
                    timestamp: Date.now(),
                });
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
    }, [emitEvent]);

    return {
        isTracking,
        startLocationTracking,
    };
};

// Hook untuk Connection Status
export const useConnectionStatus = () => {
    const { socket, isConnected } = useSocket();
    const [connectionHistory, setConnectionHistory] = useState<Array<{
        status: 'connected' | 'disconnected' | 'error';
        timestamp: Date;
        message?: string;
    }>>([]);
    const [lastError, setLastError] = useState<string | undefined>(undefined);

    useEffect(() => {
        const status = isConnected ? 'connected' : 'disconnected';
        const entry: {
            status: 'connected' | 'disconnected' | 'error';
            timestamp: Date;
            message?: string;
        } = {
            status,
            timestamp: new Date(),
            message: lastError,
        };

        setConnectionHistory(prev => [entry, ...prev.slice(0, 9)]); // Keep last 10 entries
    }, [isConnected, lastError]);

    useEffect(() => {
        if (!socket) return;

        const handleError = (err: Error) => {
            setLastError(err.message);
            setConnectionHistory(prev => [
                {
                    status: 'error',
                    timestamp: new Date(),
                    message: err.message,
                },
                ...prev.slice(0, 9),
            ]);
        };

        socket.on('connect_error', handleError);

        return () => {
            socket.off('connect_error', handleError);
        };
    }, [socket]);

    const retry = useCallback(() => {
        if (!isConnected) {
            socket?.connect();
        }
    }, [isConnected, socket]);

    const disconnect = useCallback(() => {
        socket?.disconnect();
    }, [socket]);

    return {
        isConnected,
        isConnecting: Boolean(socket && !socket.connected),
        error: lastError,
        connectionHistory,
        retry,
        disconnect,
    };
};

// Hook untuk Custom Event Listeners
export const useSocketEvent = <T>(eventName: string, callback: (data: T) => void) => {
    const { onEvent } = useSocket();

    useEffect(() => {
        const unsubscribe = onEvent(eventName, callback as (payload: unknown) => void);

        return () => {
            unsubscribe?.();
        };
    }, [eventName, callback, onEvent]);
};

// Hook untuk Room Management
export const useSocketRoom = (roomName: string, autoJoin: boolean = true) => {
    const { joinOrderRoom, joinCustomerRoom, isConnected } = useSocket();
    const [isInRoom, setIsInRoom] = useState(false);

    const join = useCallback((type: 'order' | 'customer' = 'order') => {
        if (!roomName) return;

        if (type === 'customer') {
            joinCustomerRoom(roomName);
        } else {
            joinOrderRoom(roomName);
        }

        setIsInRoom(true);
    }, [joinCustomerRoom, joinOrderRoom, roomName]);

    const leave = useCallback(() => {
        setIsInRoom(false);
    }, []);

    useEffect(() => {
        if (autoJoin && isConnected) {
            join();
        }

        return () => {
            leave();
        };
    }, [autoJoin, isConnected, join, leave]);

    return {
        isInRoom,
        join,
        leave,
    };
};
