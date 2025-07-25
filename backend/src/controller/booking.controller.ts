import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import {
    createBookingSlotService,
    deleteBookingSlotService,
    getBookingSlotByIdService,
    getBookingSlotsByProductIdService,
    updateBookingSlotService
} from "../service/booking.service";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";

export const createBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
    const payload: CreateBookingSlotInput = req.body;
    const bookingSlot = await createBookingSlotService(payload);
    return ResponseUtil.success(res, bookingSlot);
});

export const getBookingSlotByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const slot = await getBookingSlotByIdService(id);
    return ResponseUtil.success(res, slot);
});

export const getBookingSlotsByProductIdController = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const slots = await getBookingSlotsByProductIdService(productId);
    return ResponseUtil.success(res, slots);
});

export const updateBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload: UpdateBookingSlotInput = req.body;
    const bookingSlot = await updateBookingSlotService(id, payload);
    return ResponseUtil.success(res, bookingSlot);
});

export const deleteBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteBookingSlotService(id);
    return ResponseUtil.success(res, { message: "Booking slot deleted successfully." });
});