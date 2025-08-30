import { Server as SocketIOServer } from 'socket.io';
import { config } from './index';
import { EnhancedSocketUtils } from '../utils/enhanced-socket.utils';

export interface SocketConfig {
    cors: {
        origin: string | string[];
        methods: string[];
        credentials: boolean;
        allowedHeaders: string[];
    };
    transports: string[];
    pingTimeout: number;
    pingInterval: number;
    upgradeTimeout: number;
    maxHttpBufferSize: number;
    allowEIO3: boolean;
}

export const defaultSocketConfig: SocketConfig = {
    cors: {
        origin: config.isProduction
            ? (Array.isArray(config.CLIENT_URL) ? config.CLIENT_URL : [config.CLIENT_URL])
            : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["authorization", "content-type"]
    },
    transports: config.isProduction ? ['websocket'] : ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: false // Disable Engine.IO v3 untuk keamanan
};

/**
 * Get socket configuration with optional overrides
 */
export function getSocketConfig(overrides: Partial<SocketConfig> = {}): SocketConfig {
    return {
        ...defaultSocketConfig,
        ...overrides,
        cors: {
            ...defaultSocketConfig.cors,
            ...overrides.cors
        }
    };
}

/**
 * Convert socket config to Socket.IO ServerOptions
 */
export function toServerOptions(socketConfig: SocketConfig): any {
    return {
        cors: socketConfig.cors,
        transports: socketConfig.transports,
        pingTimeout: socketConfig.pingTimeout,
        pingInterval: socketConfig.pingInterval,
        upgradeTimeout: socketConfig.upgradeTimeout,
        maxHttpBufferSize: socketConfig.maxHttpBufferSize,
        allowEIO3: socketConfig.allowEIO3
    };
}

// Socket Utility Class untuk operasi socket yang reusable
export class SocketUtils {
    private static io: SocketIOServer | null = null;

    /**
     * Set Socket.IO instance
     */
    static setSocketIO(io: SocketIOServer): void {
        this.io = io;
    }

    /**
     * Get Socket.IO instance
     */
    static getSocketIO(): SocketIOServer {
        if (!this.io) {
            throw new Error('Socket.IO server not initialized. Call setSocketIO first.');
        }
        return this.io;
    }

    /**
     * Emit to specific room
     */
    static emitToRoom(room: string, event: string, data: any): boolean {
        try {
            const io = this.getSocketIO();
            io.to(room).emit(event, data);
            console.log(`📡 Emitted ${event} to room: ${room}`);
            return true;
        } catch (error) {
            console.error('❌ Error emitting to room:', error);
            return false;
        }
    }

    /**
     * Emit to specific socket ID
     */
    static emitToSocket(socketId: string, event: string, data: any): boolean {
        try {
            const io = this.getSocketIO();
            io.to(socketId).emit(event, data);
            console.log(`📡 Emitted ${event} to socket: ${socketId}`);
            return true;
        } catch (error) {
            console.error('❌ Error emitting to socket:', error);
            return false;
        }
    }

    /**
     * Emit to all connected clients
     */
    static emitToAll(event: string, data: any): boolean {
        try {
            const io = this.getSocketIO();
            io.emit(event, data);
            console.log(`📡 Emitted ${event} to all clients`);
            return true;
        } catch (error) {
            console.error('❌ Error emitting to all:', error);
            return false;
        }
    }

    /**
     * Join socket to room
     */
    static joinRoom(socketId: string, room: string): boolean {
        try {
            const io = this.getSocketIO();
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(room);
                console.log(`📡 Socket ${socketId} joined room: ${room}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error joining room:', error);
            return false;
        }
    }

    /**
     * Leave socket from room
     */
    static leaveRoom(socketId: string, room: string): boolean {
        try {
            const io = this.getSocketIO();
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(room);
                console.log(`📡 Socket ${socketId} left room: ${room}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error leaving room:', error);
            return false;
        }
    }

    /**
     * Get all rooms
     */
    static getAllRooms(): string[] {
        try {
            const io = this.getSocketIO();
            return Array.from(io.sockets.adapter.rooms.keys());
        } catch (error) {
            console.error('❌ Error getting rooms:', error);
            return [];
        }
    }

    /**
     * Get sockets in room
     */
    static getSocketsInRoom(room: string): string[] {
        try {
            const io = this.getSocketIO();
            const roomSockets = io.sockets.adapter.rooms.get(room);
            return roomSockets ? Array.from(roomSockets) : [];
        } catch (error) {
            console.error('❌ Error getting sockets in room:', error);
            return [];
        }
    }

    /**
     * Check if socket exists
     */
    static socketExists(socketId: string): boolean {
        try {
            const io = this.getSocketIO();
            return io.sockets.sockets.has(socketId);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get socket stats
     */
    static getStats(): {
        connectedSockets: number;
        totalRooms: number;
        rooms: string[];
    } | null {
        try {
            const io = this.getSocketIO();
            const rooms = Array.from(io.sockets.adapter.rooms.keys());
            const connectedSockets = io.sockets.sockets.size;

            return {
                connectedSockets,
                totalRooms: rooms.length,
                rooms: rooms.filter(room => !io.sockets.sockets.has(room)) // Filter out socket IDs
            };
        } catch (error) {
            console.error('❌ Error getting socket stats:', error);
            return null;
        }
    }

    /**
     * Broadcast to room except sender
     */
    static broadcastToRoom(room: string, event: string, data: any, excludeSocketId?: string): boolean {
        try {
            const io = this.getSocketIO();
            const roomSockets = io.sockets.adapter.rooms.get(room);

            if (!roomSockets) return false;

            for (const socketId of roomSockets) {
                if (socketId !== excludeSocketId) {
                    io.to(socketId).emit(event, data);
                }
            }

            console.log(`📡 Broadcasted ${event} to room: ${room} (excluding ${excludeSocketId || 'none'})`);
            return true;
        } catch (error) {
            console.error('❌ Error broadcasting to room:', error);
            return false;
        }
    }

    /**
     * Send notification to room
     */
    static sendNotificationToRoom(room: string, notification: {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }): boolean {
        const data = {
            ...notification,
            room,
            createdAt: new Date()
        };

        return this.emitToRoom(room, 'notification', data);
    }

    /**
     * Send system announcement to all
     */
    static sendSystemAnnouncement(announcement: {
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }): boolean {
        const data = {
            id: `announcement_${Date.now()}`,
            ...announcement,
            createdAt: new Date()
        };

        return this.emitToAll('system_announcement', data);
    }
}

// Export utility functions untuk penggunaan langsung
export const socketUtils = {
    emitToRoom: (room: string, event: string, data: any) => EnhancedSocketUtils.emitToRoom(room, event, data),
    emitToSocket: (socketId: string, event: string, data: any) => EnhancedSocketUtils.emitToSocket(socketId, event, data),
    emitToAll: (event: string, data: any) => EnhancedSocketUtils.broadcast(event, data),
    joinRoom: (socketId: string, room: string) => EnhancedSocketUtils.joinRoom(socketId, room),
    leaveRoom: (socketId: string, room: string) => EnhancedSocketUtils.leaveRoom(socketId, room),
    getAllRooms: () => {
        const status = EnhancedSocketUtils.getSocketStatus();
        return status.rooms.map(room => room.name);
    },
    getSocketsInRoom: (room: string) => {
        const roomInfo = EnhancedSocketUtils.getRoomInfo(room);
        return roomInfo ? roomInfo.socketIds : [];
    },
    socketExists: (socketId: string) => {
        const io = EnhancedSocketUtils.getIO();
        return io.sockets.sockets.has(socketId);
    },
    getStats: () => {
        const status = EnhancedSocketUtils.getSocketStatus();
        return {
            connectedSockets: status.totalSockets,
            totalRooms: status.rooms.length,
            rooms: status.rooms.map(room => room.name)
        };
    },
    broadcastToRoom: (room: string, event: string, data: any, excludeSocketId?: string) => {
        // For now, use emitToRoom since broadcastToRoom is not implemented in EnhancedSocketUtils
        return EnhancedSocketUtils.emitToRoom(room, event, data);
    },
    sendNotificationToRoom: (room: string, notification: any) => {
        // For now, use emitToRoom since sendNotificationToRoom is not implemented in EnhancedSocketUtils
        return EnhancedSocketUtils.emitToRoom(room, 'notification', notification);
    },
    sendSystemAnnouncement: (announcement: any) => {
        // For now, use broadcast since sendSystemAnnouncement is not implemented in EnhancedSocketUtils
        return EnhancedSocketUtils.broadcast('system_announcement', announcement);
    }
};
