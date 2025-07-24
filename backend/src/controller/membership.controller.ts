import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    createMembershipService,
    deleteMembershipService,
    getMembershipByIdService,
    getMembershipsByBusinessIdService,
    updateMembershipService
} from "../service/membership.service";

export const createMembershipController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const membership = await createMembershipService(payload);
    return ResponseUtil.success(res, membership, HttpStatus.CREATED);
});

export const getMembershipByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const membership = await getMembershipByIdService(id);
    return ResponseUtil.success(res, membership);
});

export const getMembershipsByBusinessIdController = asyncHandler(async (req: Request, res: Response) => {
    const { businessId } = req.params;
    const memberships = await getMembershipsByBusinessIdService(businessId);
    return ResponseUtil.success(res, memberships);
});

export const updateMembershipController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const membership = await updateMembershipService(id, payload);
    return ResponseUtil.success(res, membership);
});

export const deleteMembershipController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const membership = await deleteMembershipService(id);
    return ResponseUtil.success(res, membership);
});