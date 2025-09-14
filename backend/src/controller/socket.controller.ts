import { Request, Response } from 'express';
import { getUnifiedSocketStats, getUnifiedSocketIO } from '../config/socket-unified';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getSocketStatsController = asyncHandler(async function getSocketStatsController(req: Request, res: Response) {
    const stats = getUnifiedSocketStats();

    if (!stats) {
        return res.status(503).json({
            success: false,
            message: 'Socket.IO server not available'
        });
    }

    return ResponseUtil.success(res, stats, undefined, 'Socket.IO statistics retrieved successfully');
})

export const testEmitController = asyncHandler(async function testEmitController(req: Request, res: Response) {
    const { businessId, event, data } = req.body;

    if (!businessId || !event) {
        return res.status(400).json({
            success: false,
            message: 'businessId and event are required'
        });
    }

    const io = getUnifiedSocketIO();

    // Test emit
    (io.to(businessId) as any).emit(event, data || { test: true, timestamp: new Date() });

    return ResponseUtil.success(res, {
        businessId,
        event,
        emitted: true
    }, undefined, 'Test event emitted successfully');
})


export const getBusinessSocketsController = asyncHandler(async function getBusinessSocketsController(req: Request, res: Response) {
    const { businessId } = req.params;

    if (!businessId) {
        return res.status(400).json({
            success: false,
            message: 'businessId is required'
        });
    }

    const io = getUnifiedSocketIO();
    const room = io.sockets.adapter.rooms.get(businessId);

    const connectedSockets = room ? Array.from(room) : [];
    const socketDetails = [];

    for (const socketId of connectedSockets) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            socketDetails.push({
                socketId,
                userId: socket.data.userId,
                userRole: socket.data.userRole,
                businessId: socket.data.businessId,
                joinedRooms: socket.data.joinedRooms,
                connected: socket.connected,
                connectedAt: socket.handshake.time
            });
        }
    }

    return ResponseUtil.success(res, {
        businessId,
        totalConnected: connectedSockets.length,
        sockets: socketDetails
    }, undefined, 'Business sockets retrieved successfully');
})