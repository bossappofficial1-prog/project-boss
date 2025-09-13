import { Server as SocketIOServer, Socket } from 'socket.io';

export interface SocketEventData {
    message?: string;
    orderId?: string;
    status?: string;
    timestamp?: Date;
    [key: string]: any;
}

export interface RoomInfo {
    name: string;
    socketCount: number;
    socketIds: string[];
}

export interface SocketStatus {
    totalSockets: number;
    authenticatedSockets: number;
    publicSockets: number;
    rooms: RoomInfo[];
    socketDetails: SocketDetail[];
}

export interface SocketDetail {
    id: string;
    authenticated: boolean;
    joinedRooms: string[];
    clientIP?: string;
}

/**
 * Enhanced Socket Utilities Class
 * Provides clean and reliable socket operations
 */
export class EnhancedSocketUtils {
    private static io: SocketIOServer | null = null;

    /**
     * Initialize the Socket.IO server instance
     */
    static initialize(io: SocketIOServer): void {
        this.io = io;
        console.log('🚀 Enhanced Socket Utils initialized');
    }

    /**
     * Get the Socket.IO server instance
     */
    static getIO(): SocketIOServer {
        if (!this.io) {
            throw new Error('Socket.IO server not initialized. Call initialize() first.');
        }
        return this.io;
    }

    /**
     * Emit event to a specific room
     */
    static emitToRoom(roomName: string, eventName: string, data: SocketEventData): boolean {
        try {
            const io = this.getIO();

            console.log(`📡 Emitting ${eventName} to room: ${roomName}`);
            console.log(`📊 Event data:`, JSON.stringify(data, null, 2));

            // Get room info before emit
            const roomSockets = io.sockets.adapter.rooms.get(roomName);
            const socketCount = roomSockets ? roomSockets.size : 0;

            console.log(`👥 Room ${roomName} has ${socketCount} sockets:`,
                roomSockets ? Array.from(roomSockets) : []);

            if (socketCount === 0) {
                console.warn(`⚠️ No sockets in room ${roomName}. Event will not be received by anyone.`);
            }

            // Emit to room
            io.to(roomName).emit(eventName, data);

            console.log(`✅ Successfully emitted ${eventName} to room ${roomName}`);
            return true;

        } catch (error) {
            console.error(`❌ Error emitting to room ${roomName}:`, error);
            return false;
        }
    }

    /**
     * Emit event to a specific socket
     */
    static emitToSocket(socketId: string, eventName: string, data: SocketEventData): boolean {
        try {
            const io = this.getIO();
            const socket = io.sockets.sockets.get(socketId);

            if (!socket) {
                console.error(`❌ Socket ${socketId} not found`);
                return false;
            }

            console.log(`📡 Emitting ${eventName} to socket: ${socketId}`);
            socket.emit(eventName, data);

            console.log(`✅ Successfully emitted ${eventName} to socket ${socketId}`);
            return true;

        } catch (error) {
            console.error(`❌ Error emitting to socket ${socketId}:`, error);
            return false;
        }
    }

    /**
     * Join a socket to a room
     */
    static joinRoom(socketId: string, roomName: string): boolean {
        try {
            const io = this.getIO();
            const socket = io.sockets.sockets.get(socketId);

            if (!socket) {
                console.error(`❌ Socket ${socketId} not found`);
                return false;
            }

            console.log(`🔗 Joining socket ${socketId} to room ${roomName}...`);
            socket.join(roomName);

            // Verify join
            const roomSockets = io.sockets.adapter.rooms.get(roomName);
            const isJoined = roomSockets ? roomSockets.has(socketId) : false;

            if (isJoined) {
                console.log(`✅ Socket ${socketId} successfully joined room ${roomName}`);
                // Notify the socket that it joined the room
                socket.emit('room_joined', roomName);
            } else {
                console.error(`❌ Socket ${socketId} failed to join room ${roomName}`);
            }

            return isJoined;

        } catch (error) {
            console.error(`❌ Error joining socket ${socketId} to room ${roomName}:`, error);
            return false;
        }
    }

    /**
     * Leave a socket from a room
     */
    static leaveRoom(socketId: string, roomName: string): boolean {
        try {
            const io = this.getIO();
            const socket = io.sockets.sockets.get(socketId);

            if (!socket) {
                console.error(`❌ Socket ${socketId} not found`);
                return false;
            }

            console.log(`🔌 Leaving socket ${socketId} from room ${roomName}...`);
            socket.leave(roomName);

            console.log(`✅ Socket ${socketId} left room ${roomName}`);
            return true;

        } catch (error) {
            console.error(`❌ Error leaving socket ${socketId} from room ${roomName}:`, error);
            return false;
        }
    }

    /**
     * Get detailed socket status
     */
    static getSocketStatus(): SocketStatus {
        try {
            const io = this.getIO();

            const allSockets = Array.from(io.sockets.sockets.values());
            const totalSockets = allSockets.length;

            let authenticatedSockets = 0;
            let publicSockets = 0;
            const socketDetails: SocketDetail[] = [];

            // Analyze all sockets
            for (const socket of allSockets) {
                const isAuthenticated = (socket as any).data?.authenticated || false;

                if (isAuthenticated) {
                    authenticatedSockets++;
                } else {
                    publicSockets++;
                }

                socketDetails.push({
                    id: socket.id,
                    authenticated: isAuthenticated,
                    joinedRooms: (socket as any).data?.joinedRooms || [],
                    clientIP: (socket as any).data?.clientIP || 'unknown'
                });
            }

            // Get room information
            const rooms: RoomInfo[] = [];
            for (const [roomName, socketSet] of io.sockets.adapter.rooms) {
                // Skip rooms that are actually socket IDs
                if (io.sockets.sockets.has(roomName)) continue;

                rooms.push({
                    name: roomName,
                    socketCount: socketSet.size,
                    socketIds: Array.from(socketSet)
                });
            }

            return {
                totalSockets,
                authenticatedSockets,
                publicSockets,
                rooms,
                socketDetails
            };

        } catch (error) {
            console.error('❌ Error getting socket status:', error);
            return {
                totalSockets: 0,
                authenticatedSockets: 0,
                publicSockets: 0,
                rooms: [],
                socketDetails: []
            };
        }
    }

    /**
     * Get information about a specific room
     */
    static getRoomInfo(roomName: string): RoomInfo | null {
        try {
            const io = this.getIO();
            const roomSockets = io.sockets.adapter.rooms.get(roomName);

            if (!roomSockets) {
                return null;
            }

            return {
                name: roomName,
                socketCount: roomSockets.size,
                socketIds: Array.from(roomSockets)
            };

        } catch (error) {
            console.error(`❌ Error getting room info for ${roomName}:`, error);
            return null;
        }
    }

    /**
     * Broadcast to all connected sockets
     */
    static broadcast(eventName: string, data: SocketEventData): boolean {
        try {
            const io = this.getIO();

            console.log(`📢 Broadcasting ${eventName} to all sockets`);
            io.emit(eventName, data);

            console.log(`✅ Successfully broadcasted ${eventName}`);
            return true;

        } catch (error) {
            console.error(`❌ Error broadcasting ${eventName}:`, error);
            return false;
        }
    }

    /**
     * Test socket connectivity
     */
    static async testConnectivity(socketId: string): Promise<boolean> {
        try {
            const success = this.emitToSocket(socketId, 'ping', {
                message: 'Connectivity test',
                timestamp: new Date()
            });

            return success;
        } catch (error) {
            console.error(`❌ Connectivity test failed for socket ${socketId}:`, error);
            return false;
        }
    }
}
