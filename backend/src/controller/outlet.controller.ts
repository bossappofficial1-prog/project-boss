import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    createOutletService,
    deleteOutletService,
    getAllOutletsService,
    getOutletByIdService,
    getOutletsByBusinessIdService,
    getFeaturedOutletsService,
    updateOutletService,
    findNearbyOutletsService,
    findOutletsInViewportService,
    updateOutletLocationService,
    uploadQRISService,
    getQRISService,
    getOutletAnalytics,
    getOutletRevenueTrend,
    getOutletBySlugService,
    getOutletSlugsService
} from "../service/outlet.service";

export const findNearbyOutletsController = asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius, page, limit, search } = req.query;

    // Validasi parameter koordinat
    if (!latitude || !longitude) {
        return ResponseUtil.badRequest(res, 'Latitude and longitude are required');
    }
    const latNum = parseFloat(latitude as string);
    const lngNum = parseFloat(longitude as string);
    if (isNaN(latNum) || isNaN(lngNum)) {
        return ResponseUtil.badRequest(res, 'Latitude and longitude must be valid numbers');
    }

    const parsedRadius = radius ? parseFloat(radius as string) : 5;
    if (parsedRadius > 50) { // Batasi radius maksimal 50km untuk menghindari bounding box besar
        return ResponseUtil.error(res, 'Radius maksimal 50km', undefined, HttpStatus.BAD_REQUEST);
    }

    const outlets = await findNearbyOutletsService(
        latNum,
        lngNum,
        parsedRadius,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 10,
        search as string
    );

    return ResponseUtil.paginated(res, outlets.outlets, outlets.page, outlets.limit, outlets.totalPages, HttpStatus.OK);
});

/**
 * GET /outlets/map?latMin=...&latMax=...&lngMin=...&lngMax=...&search=...
 * Mengembalikan outlet yang berada dalam viewport bounding box peta.
 * Redis-cached per bounding box dengan TTL 60 detik.
 */
export const findOutletsInViewportController = asyncHandler(async (req: Request, res: Response) => {
    const { latMin, latMax, lngMin, lngMax, search } = req.query;

    if (!latMin || !latMax || !lngMin || !lngMax) {
        return ResponseUtil.badRequest(res, 'latMin, latMax, lngMin, lngMax are required');
    }

    const parsedLatMin = parseFloat(latMin as string);
    const parsedLatMax = parseFloat(latMax as string);
    const parsedLngMin = parseFloat(lngMin as string);
    const parsedLngMax = parseFloat(lngMax as string);

    if ([parsedLatMin, parsedLatMax, parsedLngMin, parsedLngMax].some(isNaN)) {
        return ResponseUtil.badRequest(res, 'Semua parameter bounding box harus berupa angka');
    }

    const result = await findOutletsInViewportService(
        parsedLatMin,
        parsedLatMax,
        parsedLngMin,
        parsedLngMax,
        search as string | undefined,
    );

    return ResponseUtil.success(res, result.outlets, HttpStatus.OK);
});

export const updateOutletLocationController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { latitude, longitude } = req.body;
    const ownerId = req.storedUser!.id;

    const outlet = await updateOutletLocationService(
        outletId,
        ownerId,
        parseFloat(latitude),
        parseFloat(longitude)
    );

    return ResponseUtil.success(res, outlet, HttpStatus.OK);
});

export const createOutletController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const outlet = await createOutletService(payload, ownerId);
    return ResponseUtil.success(res, outlet, HttpStatus.CREATED);
});

export const getOutletByIdController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const outlet = await getOutletByIdService(id);
    return ResponseUtil.success(res, outlet);
});

export const getOutletBySlugController = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const outlet = await getOutletBySlugService(slug);
    return ResponseUtil.success(res, outlet);
});

export const getAllOutletsController = asyncHandler(async (req: Request, res: Response) => {
    const { search, take, skip } = req.query;

    const parsedTake = take ? parseInt(take as string) : 10; // Default 10 jika tidak disediakan
    const parsedSkip = skip ? parseInt(skip as string) : 0;

    const { outlets, total } = await getAllOutletsService(
        search as string,
        parsedTake,
        parsedSkip
    );
    return ResponseUtil.paginated(res, outlets, total, parsedTake, parsedSkip);
});

export const getOutletsByBusinessIdController = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const { search, take, skip } = req.query;

    const parsedTake = take ? parseInt(take as string) : 10; // Default 10 jika tidak disediakan
    const parsedSkip = skip ? parseInt(skip as string) : 0;

    const { outlets, total } = await getOutletsByBusinessIdService(
        businessId,
        search as string,
        parsedTake,
        parsedSkip
    );
    return ResponseUtil.paginated(res, outlets, total, parsedTake, parsedSkip);
});

export const getFeaturedOutletsController = asyncHandler(async (req: Request, res: Response) => {
    const outlets = await getFeaturedOutletsService();
    return ResponseUtil.success(res, outlets);
});

export const updateOutletController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const outlet = await updateOutletService(id, payload, ownerId);
    return ResponseUtil.success(res, outlet);
});

export const deleteOutletController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerId = req.storedUser!.id;
    const outlet = await deleteOutletService(id, ownerId);
    return ResponseUtil.success(res, outlet);
});

export const getOutletSlugsController = asyncHandler(async (req: Request, res: Response) => {
    const outlets = await getOutletSlugsService();
    return ResponseUtil.success(res, outlets);
});

export const uploadQRISController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const ownerId = req.storedUser!.id;
    const result = await uploadQRISService(outletId, ownerId, req.body.fileUrl);

    return ResponseUtil.success(res, result, HttpStatus.OK, 'QRIS berhasil diupload');
});

export const getQRISController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.id as string;

    const qrisData = await getQRISService(outletId);

    return ResponseUtil.success(res, qrisData, HttpStatus.OK, 'Data QRIS berhasil diambil');
});

type RevenueTimeframe = '7d' | '30d' | '3m' | 'custom';

export const getOutletRevenueTrendController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    if (!outletId) {
        return ResponseUtil.badRequest(res, 'Outlet ID diperlukan');
    }

    const timeframeParam = (req.query.timeframe as string) ?? '30d';
    const allowedTimeframes: RevenueTimeframe[] = ['7d', '30d', '3m', 'custom'];
    const timeframe = allowedTimeframes.includes(timeframeParam as RevenueTimeframe)
        ? (timeframeParam as RevenueTimeframe)
        : '30d';

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const trend = await getOutletRevenueTrend(outletId, { timeframe, startDate, endDate });

    return ResponseUtil.success(res, trend);
});

export const getOutletAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string

    if (!outletId) {
        return ResponseUtil.badRequest(res, 'Outlet ID diperlukan');
    }

    const analytics = await getOutletAnalytics(outletId)

    return ResponseUtil.success(res, analytics)
})