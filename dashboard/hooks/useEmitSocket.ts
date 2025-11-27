import { useCallback } from 'react';
import { SocketEvents } from '@/types/socket';
import { useSocket } from './useSocket';

interface UseEmitSocketReturn {
    emitEvent: <T extends keyof SocketEvents>(
        eventName: T,
        data: SocketEvents[T]
    ) => void;
    isConnected: boolean;
}

export const useEmitSocket = (): UseEmitSocketReturn => {
    const { socket, isConnected } = useSocket();

    const emitEvent = useCallback(<T extends keyof SocketEvents>(
        eventName: T,
        data: SocketEvents[T]
    ): void => {
        if (socket && isConnected) {
            socket.emit(eventName, data);
        } else {
            console.warn('Socket tidak terhubung, tidak dapat mengirim event:', eventName);
        }
    }, [socket, isConnected]);

    return {
        emitEvent,
        isConnected,
    };
};