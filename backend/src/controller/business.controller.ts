import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    createBusinessService,
    getAllBusinessesService,
    getBusinessByIdService,
    getBusinessByOwnerIdService,
    updateBusinessService
} from "../service/business.service";

export const getAllBusinessesController = asyncHandler(async (req: Request, res: Response) => {
    const businesses = await getAllBusinessesService();
    return ResponseUtil.success(res, businesses);
});

export const getBusinessByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const business = await getBusinessByIdService(id);
    return ResponseUtil.success(res, business);
});

export const createBusinessController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const ownerId = req.user!.id;
    const business = await createBusinessService(payload, ownerId);
    return ResponseUtil.success(res, business, HttpStatus.CREATED);
});

export const getMyBusinessController = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const business = await getBusinessByOwnerIdService(ownerId);
    return ResponseUtil.success(res, business);
});

export const updateMyBusinessController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const ownerId = req.user!.id;
    const business = await updateBusinessService(id, payload, ownerId);
    return ResponseUtil.success(res, business);
});