import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;
let subscriberCount = 0;

const getOrCreateSocket = () => {
    if (!sharedSocket) {
        sharedSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:1234', {
            transports: ['websocket'],
            autoConnect: false,
        });
    }

    if (!sharedSocket.connected && sharedSocket.disconnected) {
        sharedSocket.connect();
    }

    return sharedSocket;
};

const destroySocket = () => {
    if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
    }
};

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(() => sharedSocket);
    const [isConnected, setIsConnected] = useState<boolean>(() => sharedSocket?.connected ?? false);

    useEffect(() => {
        const instance = getOrCreateSocket();
        subscriberCount += 1;
        setSocket(instance);

        const handleConnect = () => {
            console.log('Socket connected', instance.id);
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        };

        instance.on('connect', handleConnect);
        instance.on('disconnect', handleDisconnect);

        if (!instance.connected) {
            instance.connect();
        } else {
            setIsConnected(true);
        }

        return () => {
            instance.off('connect', handleConnect);
            instance.off('disconnect', handleDisconnect);

            subscriberCount = Math.max(0, subscriberCount - 1);
            if (subscriberCount === 0) {
                destroySocket();
                setIsConnected(false);
                setSocket(null);
            }
        };
    }, []);

    const connect = useCallback(() => {
        const instance = getOrCreateSocket();
        setSocket(instance);
        if (!instance.connected) {
            instance.connect();
        }
    }, []);

    const disconnect = useCallback(() => {
        destroySocket();
        setIsConnected(false);
        setSocket(null);
    }, []);

    return {
        socket,
        isConnected,
        connect,
        disconnect,
    };
};