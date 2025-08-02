import { Request, Response } from "express";
import { OperatingHoursRepository } from "../repositories/operating-hours.repository";
import { HttpStatus } from "../constants/http-status";
import { CreateOperatingHoursInput, UpdateOperatingHoursInput } from "../schemas/operating-hours.schema";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { AppError } from "../errors/app-error";

export const createOperatingHoursController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreateOperatingHoursInput;
    const operatingHours = await OperatingHoursRepository.create(payload);
    return ResponseUtil.success(res, operatingHours, HttpStatus.CREATED);
});

export const getOperatingHoursByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const operatingHours = await OperatingHoursRepository.findByOutletId(outletId);
    return ResponseUtil.success(res, operatingHours);
});

export const updateOperatingHoursController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateOperatingHoursInput;

    const operatingHours = await OperatingHoursRepository.findById(id);
    if (!operatingHours) {
        throw new AppError("Jam operasional tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const updatedOperatingHours = await OperatingHoursRepository.update(id, payload);
    return ResponseUtil.success(res, updatedOperatingHours);
});

export const upsertOperatingHoursController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreateOperatingHoursInput;
    const { outletId, dayOfWeek } = payload;

    const operatingHours = await OperatingHoursRepository.upsertOperatingHours(outletId, dayOfWeek, payload);
    return ResponseUtil.success(res, operatingHours);
});
