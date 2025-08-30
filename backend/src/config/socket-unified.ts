import { Server } from 'socket.io';
import http from 'http';
import { Express } from 'express';
import { config } from './index';
import {
    TypedServer,
    TypedSocket,
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '../types/socket';
import {
    businessRoomAuthMiddleware,
    socketRateLimiter,
    conditionalAuthMiddleware
} from '../middleware/socket.middleware';
import {
    getSocketConfig,
    toServerOptions,
    SocketUtils
} from './socket.config';
import { EnhancedSocketUtils } from '../utils/enhanced-socket.utils';

let io: TypedServer;

export function initUnifiedSocket(app: Express) {
    const server = http.createServer(app);

    // Gunakan konfigurasi socket yang terpusat
    const socketConfig = getSocketConfig();
    const serverOptions = toServerOptions(socketConfig);

    io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, serverOptions);

    // Initialize Enhanced Socket Utils
    EnhancedSocketUtils.initialize(io);
    SocketUtils.setSocketIO(io); // Also initialize the old one for compatibility

    // Middleware conditional untuk auth - bisa dengan atau tanpa auth
    io.use(conditionalAuthMiddleware);

    // Event handler untuk semua koneksi (auth dan public)
    io.on('connection', (socket: TypedSocket) => {
        try {
            if (socket.data.authenticated) {
                console.log(`✅ Authenticated user connected: ${socket.data.userId} (${socket.id})`);
                handleAuthenticatedConnection(socket);
            } else {
                console.log(`🌐 Public user connected: ${socket.id} from ${socket.data.clientIP}`);
                handlePublicConnection(socket);
            }
        } catch (error) {
            console.error('❌ Socket connection error:', error);
            socket.emit('error', 'Connection failed');
            socket.disconnect();
        }
    });

    console.log('🚀 Socket.IO server initialized (unified auth + public)');
    return server;
}

/**
 * Handle koneksi untuk user yang sudah terauthentikasi
 */
function handleAuthenticatedConnection(socket: TypedSocket) {
    // Event handler untuk join business room
    socket.on('join_business_room', (businessId: string, callback) => {
        try {
            // Rate limiting check
            if (!socketRateLimiter.checkLimit(socket.id)) {
                const error = 'Rate limit exceeded';
                console.warn(`⚠️ Rate limit exceeded for socket ${socket.id}`);
                socket.emit('error', error);
                callback?.(false);
                return;
            }

            // Authorization check
            if (!businessRoomAuthMiddleware(businessId, socket)) {
                const error = 'Unauthorized to access this business room';
                console.warn(`⚠️ Unauthorized access attempt by ${socket.data.userId} to business ${businessId}`);
                socket.emit('error', error);
                callback?.(false);
                return;
            }

            // Join room
            socket.join(businessId);
            socket.data.joinedRooms.push(businessId);
            socket.emit('business_room_joined', businessId);
            console.log(`📡 User ${socket.data.userId} joined business room: ${businessId}`);

            if (callback) callback(true);
        } catch (error) {
            console.error('❌ Error joining business room:', error);
            socket.emit('error', 'Failed to join business room');
            if (callback) callback(false);
        }
    });

    // Event handler untuk leave business room
    socket.on('leave_business_room', (businessId: string, callback) => {
        try {
            socket.leave(businessId);
            socket.data.joinedRooms = socket.data.joinedRooms.filter(room => room !== businessId);
            socket.emit('business_room_left', businessId);
            console.log(`📡 User ${socket.data.userId} left business room: ${businessId}`);

            if (callback) callback(true);
        } catch (error) {
            console.error('❌ Error leaving business room:', error);
            socket.emit('error', 'Failed to leave business room');
            if (callback) callback(false);
        }
    });

    // Event handler untuk ping-pong (health check)
    socket.on('ping', (callback?: (response: string) => void) => {
        if (callback) {
            callback('pong');
        } else {
            socket.emit('pong', 'pong');
        }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log(`❌ Authenticated user disconnected: ${socket.data.userId} (${socket.id}), reason: ${reason}`);
    });
}

/**
 * Handle koneksi untuk public user (tanpa authentication)
 */
function handlePublicConnection(socket: TypedSocket) {
    // Send connection info
    socket.emit('connection_info', {
        socketId: socket.id,
        connected: true,
        type: 'public'
    });

    // Auto join announcements room untuk public users
    socket.join('public_announcements');
    socket.data.joinedRooms.push('public_announcements');
    socket.emit('announcements_joined');

    // Event handler untuk ping-pong (health check)
    socket.on('ping', (callback?: (response: string) => void) => {
        if (callback) {
            callback('pong');
        } else {
            socket.emit('pong', 'pong');
        }
    });

    // Event handler untuk test event dari frontend
    socket.on('test_event', (data: any) => {
        console.log('🧪 Test event received from frontend:', data);
        console.log('📡 Responding to test event from socket:', socket.id);

        // Send response back to the sender
        socket.emit('test_response', {
            message: 'Test event received successfully',
            originalData: data,
            serverTimestamp: new Date(),
            socketId: socket.id
        });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log(`❌ Public user disconnected: ${socket.id}, reason: ${reason}`);
    });
}

export function getUnifiedSocketIO(): TypedServer {
    if (!io) {
        throw new Error('Socket.IO server not initialized');
    }
    return io;
}

export function emitToBusinessRoom(
    businessId: string,
    event: keyof ServerToClientEvents,
    data: any
): boolean {
    return EnhancedSocketUtils.emitToRoom(businessId, event as string, data);
}

export function emitNotificationToBusinessRoom(
    businessId: string,
    notification: {
        id: string;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }
): boolean {
    // For now, use emitToRoom with notification event
    return EnhancedSocketUtils.emitToRoom(businessId, 'notification', notification);
}

// Public Socket Functions untuk emit ke public users
export function emitToOrderTracking(orderId: string, event: string, data: any): boolean {
    const trackingRoom = `order_tracking_${orderId}`;
    return EnhancedSocketUtils.emitToRoom(trackingRoom, event, data);
}

export function emitAnnouncement(announcement: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}): boolean {
    // For now, broadcast to all public users
    return EnhancedSocketUtils.broadcast('system_announcement', announcement);
}

export function getUnifiedSocketStats(): {
    connectedSockets: number;
    authenticatedSockets: number;
    publicSockets: number;
    totalRooms: number;
    rooms: string[];
} | null {
    try {
        if (!io) {
            return null;
        }

        const rooms = Array.from(io.sockets.adapter.rooms.keys());
        const connectedSockets = io.sockets.sockets.size;

        let authenticatedSockets = 0;
        let publicSockets = 0;

        for (const socket of io.sockets.sockets.values()) {
            if (socket.data.authenticated) {
                authenticatedSockets++;
            } else {
                publicSockets++;
            }
        }

        return {
            connectedSockets,
            authenticatedSockets,
            publicSockets,
            totalRooms: rooms.length,
            rooms: rooms.filter(room => !io.sockets.sockets.has(room)) // Filter out socket IDs
        };
    } catch (error) {
        console.error('❌ Error getting unified socket stats:', error);
        return null;
    }
}
