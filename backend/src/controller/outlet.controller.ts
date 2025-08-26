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
    const { latitude, longitude, radius, page, limit } = req.query;

    const outlets = await findNearbyOutletsService(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        radius ? parseFloat(radius as string) : undefined,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
    );

    return ResponseUtil.paginated(res, outlets.outlets, outlets.page, outlets.limit, outlets.totalPages, HttpStatus.OK);
});

export const updateOutletLocationController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const { latitude, longitude } = req.body;
    const ownerId = req.user!.id;

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
    const ownerId = req.user!.id;
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

    const parsedTake = take ? parseInt(take as string) : undefined;
    const parsedSkip = skip ? parseInt(skip as string) : undefined;

    const { outlets, total } = await getAllOutletsService(
        search as string,
        parsedTake,
        parsedSkip
    );
    return ResponseUtil.paginated(res, outlets, total, parsedTake || 0, parsedSkip || 0);
});

export const getOutletsByBusinessIdController = asyncHandler(async (req: Request, res: Response) => {
    const { businessId } = req.params;
    const { search, take, skip } = req.query;

    const parsedTake = take ? parseInt(take as string) : undefined;
    const parsedSkip = skip ? parseInt(skip as string) : undefined;

    const { outlets, total } = await getOutletsByBusinessIdService(
        businessId,
        search as string,
        parsedTake,
        parsedSkip
    );
    return ResponseUtil.paginated(res, outlets, total, parsedTake || 0, parsedSkip || 0);
});

export const getFeaturedOutletsController = asyncHandler(async (req: Request, res: Response) => {
    const outlets = await getFeaturedOutletsService();
    return ResponseUtil.success(res, outlets);
});

export const updateOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const ownerId = req.user!.id;
    const outlet = await updateOutletService(id, payload, ownerId);
    return ResponseUtil.success(res, outlet);
});

export const deleteOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.user!.id;
    const outlet = await deleteOutletService(id, ownerId);
    return ResponseUtil.success(res, outlet);
});