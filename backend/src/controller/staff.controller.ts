import { Request, Response } from "express";
import { StaffRepository } from "../repositories/staff.repository";
import { HttpStatus } from "../constants/http-status";
// import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff.schema";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { AppError } from "../errors/app-error";
import { StaffFormValues, UpdateStaffSchemaValues } from "../schemas/staff.schema";
import { getOutletByIdService } from "../service/outlet.service";
import { PlanLimitService } from "../service/plan-limit.service";

export const createStaffController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as StaffFormValues;
    const storedUser = req.storedUser as typeof req.storedUser & { businessId?: string };
    const businessId = storedUser?.businessId;

    if (!businessId) {
        throw new AppError("Business ID tidak ditemukan", HttpStatus.FORBIDDEN);
    }

    const outlet = await getOutletByIdService(payload.outletId);
    if (outlet.businessId !== businessId) {
        throw new AppError("Outlet tidak termasuk dalam bisnis Anda", HttpStatus.FORBIDDEN);
    }

    await PlanLimitService.assertCanCreateStaff(businessId);
    const staff = await StaffRepository.create(payload);
    await PlanLimitService.invalidateUsageCache(businessId);
    return ResponseUtil.success(res, staff, HttpStatus.CREATED);
});

export const getStaffByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const staff = await StaffRepository.findById(id as string);

    if (!staff) {
        throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    return ResponseUtil.success(res, staff);
});

export const getStaffByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const staff = await StaffRepository.findByOutletId(outletId as string);
    return ResponseUtil.success(res, staff);
});

export const updateStaffController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateStaffSchemaValues;

    const staff = await StaffRepository.findById(id as string);
    if (!staff) {
        throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const updatedStaff = await StaffRepository.update(id as string, payload);
    return ResponseUtil.success(res, updatedStaff);
});

export const deleteStaffController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const staff = await StaffRepository.findById(id as string);
    if (!staff) {
        throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const storedUser = req.storedUser as typeof req.storedUser & { businessId?: string };
    const businessId = storedUser?.businessId;

    if (!businessId) {
        throw new AppError("Business ID tidak ditemukan", HttpStatus.FORBIDDEN);
    }

    if (staff.outlet?.businessId !== businessId) {
        throw new AppError("Anda tidak berhak menghapus staff pada outlet ini", HttpStatus.FORBIDDEN);
    }

    await StaffRepository.delete(id as string);
    await PlanLimitService.invalidateUsageCache(businessId);
    return ResponseUtil.success(res, { message: "Staff berhasil dihapus" });
});
