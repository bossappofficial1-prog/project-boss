import { Request, Response } from "express";
import { StaffRepository } from "../repositories/staff.repository";
import { HttpStatus } from "../constants/http-status";
import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff.schema";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { AppError } from "../errors/app-error";

export const createStaffController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreateStaffInput;
    const staff = await StaffRepository.create(payload);
    return ResponseUtil.success(res, staff, HttpStatus.CREATED);
});

export const getStaffByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const staff = await StaffRepository.findById(id);

    if (!staff) {
        throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    return ResponseUtil.success(res, staff);
});

export const getStaffByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const staff = await StaffRepository.findByOutletId(outletId);
    return ResponseUtil.success(res, staff);
});

export const updateStaffController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateStaffInput;

    const staff = await StaffRepository.findById(id);
    if (!staff) {
        throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const updatedStaff = await StaffRepository.update(id, payload);
    return ResponseUtil.success(res, updatedStaff);
});

export const deleteStaffController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const staff = await StaffRepository.findById(id);
    if (!staff) {
        throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    await StaffRepository.delete(id);
    return ResponseUtil.success(res, { message: "Staff berhasil dihapus" });
});
