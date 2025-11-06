import { useEffect, useRef } from 'react';
import { SocketEvents, UseSocketEventOptions } from '@/types/socket';
import { useSocket } from './useSocket';

export const useSocketEvent = <T extends keyof SocketEvents>(
    eventName: T,
    callback: (data: SocketEvents[T]) => void,
    options: UseSocketEventOptions = {}
): void => {
    const { socket, isConnected } = useSocket();
    const callbackRef = useRef(callback);
    const { enabled = true } = options;

    // Update callback ref jika callback berubah
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket || !isConnected || !enabled) return;

        const handler = (data: SocketEvents[T]) => {
            callbackRef.current(data);
        };

        socket.on(eventName as any, handler);

        return () => {
            socket.off(eventName as any, handler);
        };
    }, [socket, isConnected, eventName, enabled]);
};