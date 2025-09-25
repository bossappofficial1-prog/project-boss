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
    updateOutletLocationService
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

export const updateOutletLocationController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
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
    const { id } = req.params;
    const outlet = await getOutletByIdService(id);
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
    const { businessId } = req.params;
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
    const { id } = req.params;
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const outlet = await updateOutletService(id, payload, ownerId);
    return ResponseUtil.success(res, outlet);
});

export const deleteOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.storedUser!.id;
    const outlet = await deleteOutletService(id, ownerId);
    return ResponseUtil.success(res, outlet);
});