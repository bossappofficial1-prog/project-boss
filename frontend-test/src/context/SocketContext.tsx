'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket Event Types
export interface SocketEvents {
    // Connection events
    connect: () => void;
    disconnect: (reason: string) => void;
    connect_error: (error: Error) => void;

    // Order events
    order_status_updated: (data: { orderId: string; status: string; message?: string }) => void;
    order_confirmed: (data: { orderId: string; estimatedTime: number }) => void;
    order_ready: (data: { orderId: string; pickupCode: string }) => void;
    order_cancelled: (data: { orderId: string; reason: string }) => void;

    // Notification events
    notification: (data: { type: string; title: string; message: string; data?: any }) => void;

    // Outlet events
    outlet_status_changed: (data: { outletId: string; isOpen: boolean; reason?: string }) => void;
    outlet_busy: (data: { outletId: string; estimatedWaitTime: number }) => void;

    // User events
    user_message: (data: { from: string; message: string; timestamp: string }) => void;
}

// Socket Context Type
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    emit: <T extends keyof SocketEvents>(event: T, data?: any) => void;
    on: <T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) => void;
    off: <T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]) => void;
    joinRoom: (roomName: string) => void;
    leaveRoom: (roomName: string) => void;
}

// Create Context
const SocketContext = createContext<SocketContextType | null>(null);

// Socket configuration from environment variables
const SOCKET_CONFIG = {
    url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    options: {
        path: process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io/',
        reconnection: process.env.NEXT_PUBLIC_SOCKET_RECONNECTION === 'true',
        reconnectionAttempts: parseInt(process.env.NEXT_PUBLIC_SOCKET_RECONNECTION_ATTEMPTS || '5'),
        reconnectionDelay: parseInt(process.env.NEXT_PUBLIC_SOCKET_RECONNECTION_DELAY || '1000'),
        timeout: parseInt(process.env.NEXT_PUBLIC_SOCKET_TIMEOUT || '20000'),
        transports: ['websocket', 'polling'],
        autoConnect: false,
    },
};

// Socket Provider Component
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize Socket
    const initializeSocket = useCallback(() => {
        if (socket) return socket;

        const newSocket = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);
        setSocket(newSocket);
        return newSocket;
    }, [socket]);

    // Connect Function
    const connect = useCallback(() => {
        if (isConnected || isConnecting) return;

        setIsConnecting(true);
        setError(null);

        const socketInstance = initializeSocket();

        // Setup connection event listeners
        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);
            setIsConnecting(false);
            setError(null);

            // Auto-join user room if authenticated
            const userId = getUserId(); // Implement this function based on your auth
            if (userId) {
                socketInstance.emit('join', `user_${userId}`);
            }
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            setIsConnecting(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setError(error.message);
            setIsConnecting(false);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            setError(null);
        });

        socketInstance.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
            setError('Reconnection failed');
        });

        // Connect the socket
        socketInstance.connect();
    }, [isConnected, isConnecting, initializeSocket]);

    // Disconnect Function
    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setIsConnecting(false);
            setError(null);
        }
    }, [socket]);

    // Emit Function
    const emit = useCallback(<T extends keyof SocketEvents>(event: T, data?: any) => {
        if (socket && isConnected) {
            socket.emit(event as string, data);
        } else {
            console.warn('Socket not connected. Cannot emit event:', event);
        }
    }, [socket, isConnected]);

    // On Function (Subscribe to events)
    const on = useCallback(<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) => {
        if (socket) {
            socket.on(event as string, callback);
        }
    }, [socket]);

    // Off Function (Unsubscribe from events)
    const off = useCallback(<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]) => {
        if (socket) {
            if (callback) {
                socket.off(event as string, callback);
            } else {
                socket.off(event as string);
            }
        }
    }, [socket]);

    // Join Room Function
    const joinRoom = useCallback((roomName: string) => {
        if (socket && isConnected) {
            socket.emit('join', roomName);
            console.log('Joined room:', roomName);
        }
    }, [socket, isConnected]);

    // Leave Room Function
    const leaveRoom = useCallback((roomName: string) => {
        if (socket && isConnected) {
            socket.emit('leave', roomName);
            console.log('Left room:', roomName);
        }
    }, [socket, isConnected]);

    // Auto-connect on mount if user is authenticated
    useEffect(() => {
        const isAuthenticated = checkAuthStatus(); // Implement this function
        if (isAuthenticated) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, []);

    // Auto-reconnect on auth state change
    useEffect(() => {
        const handleAuthChange = () => {
            const isAuthenticated = checkAuthStatus();
            if (isAuthenticated && !isConnected) {
                connect();
            } else if (!isAuthenticated && isConnected) {
                disconnect();
            }
        };

        // Listen for auth state changes (implement based on your auth system)
        window.addEventListener('auth-state-changed', handleAuthChange);

        return () => {
            window.removeEventListener('auth-state-changed', handleAuthChange);
        };
    }, [isConnected, connect, disconnect]);

    const value: SocketContextType = {
        socket,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        emit,
        on,
        off,
        joinRoom,
        leaveRoom,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom Hook to use Socket
export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

// Utility Functions (implement these based on your auth system)
function getUserId(): string | null {
    // Get user ID from your auth system (localStorage, JWT, etc.)
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user).id : null;
    } catch {
        return null;
    }
}

function checkAuthStatus(): boolean {
    // Check if user is authenticated
    try {
        const token = localStorage.getItem('authToken');
        return !!token;
    } catch {
        return false;
    }
}

// Export types for use in other components
export type { SocketContextType };
