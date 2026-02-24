import { Request, Response } from "express";
import { OperatingHoursRepository } from "../repositories/operating-hours.repository";
import { HttpStatus } from "../constants/http-status";
import { CreateOperatingHoursInput, UpdateOperatingHoursInput } from "../schemas/operating-hours.schema";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { AppError } from "../errors/app-error";
import { ensureString } from "../utils/request";

// export const createOperatingHoursController = asyncHandler(async (req: Request, res: Response) => {
//     const payload = req.body as CreateOperatingHoursInput;
//     const operatingHours = await OperatingHoursRepository.create(payload);
//     return ResponseUtil.success(res, operatingHours, HttpStatus.CREATED);
// });

export const getOperatingHoursByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = ensureString(req.params?.outletId, "outletId");
    const operatingHours = await OperatingHoursRepository.findByOutletId(outletId);
    return ResponseUtil.success(res, operatingHours);
});

export const updateOperatingHoursController = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params?.id, "id");
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
    const outletId = req.params.outletId as string

    const operatingHours = await OperatingHoursRepository.upsertOperatingHours(outletId, payload);
    return ResponseUtil.success(res, operatingHours);
});
