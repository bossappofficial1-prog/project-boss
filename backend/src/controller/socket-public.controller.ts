import { Request, Response } from 'express';
import { getUnifiedSocketStats, emitToOrderTracking, emitAnnouncement } from '../config/socket-unified';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getPublicSocketStatsController = asyncHandler(async (req: Request, res: Response) => {
    const stats = getUnifiedSocketStats()
    if (!stats) {
        return res.status(503).json({
            success: false,
            message: 'Public Socket.IO server not available'
        });
    }

    return ResponseUtil.success(res, stats)
})

export const emitOrderTrackingControlle = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, event, data } = req.body;

    if (!orderId || !event) {
        return res.status(400).json({
            success: false,
            message: 'orderId and event are required'
        });
    }

    const success = emitToOrderTracking(orderId, event, data || {
        timestamp: new Date(),
        orderId
    });

    return ResponseUtil.success(res, {
        orderId,
        event,
        emitted: success
    }, undefined, 'Order tracking event emitted successfully');
})

export const emitOrderTrackingController = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, event, data } = req.body;

    if (!orderId || !event) {
        return res.status(400).json({
            success: false,
            message: 'orderId and event are required'
        });
    }

    const success = emitToOrderTracking(orderId, event, data || {
        timestamp: new Date(),
        orderId
    });

    return ResponseUtil.success(res, {
        orderId,
        event,
        emitted: success
    }, undefined, 'Order tracking event emitted successfully');
})

export const emitAnnouncementController = asyncHandler(async (req: Request, res: Response) => {
    const { event, data, title, message } = req.body;

    if (!event) {
        return res.status(400).json({
            success: false,
            message: 'event is required'
        });
    }

    const announcementData = data || {
        title: title || 'Announcement',
        message: message || 'New announcement available',
        timestamp: new Date(),
        type: 'info'
    };

    const success = emitAnnouncement(announcementData);

    return ResponseUtil.success(res, {
        event,
        data: announcementData,
        emitted: success
    }, undefined, 'Announcement emitted successfully');
})


export const publicSocketHealthController = asyncHandler(async (req: Request, res: Response) => {
    const stats = getUnifiedSocketStats();
    return ResponseUtil.success(res, {
        isConnected: stats !== null,
        stats
    })
});
