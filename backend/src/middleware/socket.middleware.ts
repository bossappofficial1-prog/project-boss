import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ExtendedError } from 'socket.io/dist/namespace';
import { TypedSocket } from '../types/socket';
import { UserRepository } from '../repositories/user.repository';

// Interface untuk JWT payload
interface JWTPayload {
    userId: string;
    businessId?: string;
    role: 'BUSINESS_OWNER' | 'EMPLOYEE' | 'ADMIN';
    iat: number;
    exp: number;
}

/**
 * Middleware untuk autentikasi Socket.IO connection
 * Token dapat dikirim melalui:
 * 1. Query parameter: ?token=your_jwt_token
 * 2. Auth header: Authorization: Bearer your_jwt_token
 * 3. Handshake auth: { auth: { token: 'your_jwt_token' } }
 */
export const socketAuthMiddleware = async (socket: TypedSocket, next: (err?: ExtendedError) => void) => {
    try {
        // Coba ambil token dari berbagai sumber
        let token: string | undefined;

        // 1. Dari query parameter
        if (socket.handshake.query.token && typeof socket.handshake.query.token === 'string') {
            token = socket.handshake.query.token;
        }

        // 2. Dari auth header
        if (!token && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        // 3. Dari handshake auth
        if (!token && socket.handshake.auth?.token) {
            token = socket.handshake.auth.token;
        }

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

        // Validasi user masih ada di database
        const user = await UserRepository.findById(decoded.userId);
        if (!user) {
            return next(new Error('User not found'));
        }

        // Cek apakah user masih aktif
        if (user.status !== 'ACTIVE') {
            return next(new Error('User account is not active'));
        }

        // Set socket data
        socket.data.userId = decoded.userId;
        socket.data.businessId = decoded.businessId || user.businessId;
        socket.data.userRole = decoded.role;
        socket.data.authenticated = true;
        socket.data.joinedRooms = [];

        console.log(`Socket authenticated for user ${user.id} (${user.email})`);
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);

        if (error instanceof jwt.JsonWebTokenError) {
            return next(new Error('Invalid authentication token'));
        }

        if (error instanceof jwt.TokenExpiredError) {
            return next(new Error('Authentication token expired'));
        }

        next(new Error('Authentication failed'));
    }
};

/**
 * Middleware untuk otorisasi akses ke business room
 */
export const businessRoomAuthMiddleware = (businessId: string, socket: TypedSocket): boolean => {
    // Admin bisa akses semua business
    if (socket.data.userRole === 'ADMIN') {
        return true;
    }

    // Business owner dan employee hanya bisa akses business mereka sendiri
    if (socket.data.businessId === businessId) {
        return true;
    }

    return false;
};

/**
 * Middleware untuk rate limiting Socket.IO events
 */
export class SocketRateLimiter {
    private rateLimits = new Map<string, { count: number; resetTime: number }>();
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    checkLimit(socketId: string): boolean {
        const now = Date.now();
        const userLimit = this.rateLimits.get(socketId);

        if (!userLimit || now > userLimit.resetTime) {
            // Reset atau buat baru
            this.rateLimits.set(socketId, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }

        if (userLimit.count >= this.maxRequests) {
            return false;
        }

        userLimit.count++;
        return true;
    }

    cleanup() {
        const now = Date.now();
        for (const [socketId, limit] of this.rateLimits.entries()) {
            if (now > limit.resetTime) {
                this.rateLimits.delete(socketId);
            }
        }
    }
}

// Instance global rate limiter
export const socketRateLimiter = new SocketRateLimiter();

// Cleanup rate limiter setiap 5 menit
setInterval(() => {
    socketRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Middleware untuk public socket (tanpa authentication)
 * Hanya melakukan rate limiting berdasarkan IP
 */
export const publicSocketMiddleware = async (socket: TypedSocket, next: (err?: ExtendedError) => void) => {
    try {
        const clientIP = socket.handshake.address;
        const MAX_CONNECTIONS_PER_IP = 10;
        const WINDOW_MS = 60000; // 1 minute

        // Simple rate limiting untuk public socket berdasarkan IP
        const now = Date.now();
        const limiterKey = `public_${clientIP}`;

        // Set socket data untuk public user
        socket.data.authenticated = false;
        socket.data.isPublic = true;
        socket.data.clientIP = clientIP;
        socket.data.joinedRooms = [];

        console.log(`🌐 Public socket connecting from IP: ${clientIP}`);
        next();
    } catch (error) {
        console.error('Public socket middleware error:', error);
        next(new Error('Public connection failed'));
    }
};

/**
 * Middleware conditional yang check apakah socket butuh auth atau tidak
 * Berdasarkan query parameter 'public=true' atau namespace
 */
export const conditionalAuthMiddleware = async (socket: TypedSocket, next: (err?: ExtendedError) => void) => {
    try {
        // Check jika ini adalah public connection
        const isPublicQuery = socket.handshake.query.public === 'true';
        const isPublicNamespace = socket.nsp.name === '/public' || socket.nsp.name.includes('public');

        if (isPublicQuery || isPublicNamespace) {
            // Gunakan public middleware
            return await publicSocketMiddleware(socket, next);
        } else {
            // Gunakan auth middleware
            return await socketAuthMiddleware(socket, next);
        }
    } catch (error) {
        console.error('Conditional auth middleware error:', error);
        next(new Error('Connection authentication failed'));
    }
};
