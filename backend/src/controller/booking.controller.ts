import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    createBookingSlotService,
    deleteBookingSlotService,
    getBookingSlotByIdService,
    getBookingSlotsByProductIdService,
    updateBookingSlotService,
    createBookingAndMidtransTransactionService
} from "../service/booking.service";

export const createBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const { orderId } = req.params; // Assuming orderId is passed as a param for booking
    const { bookingSlot, midtransTransaction } = await createBookingAndMidtransTransactionService(payload, orderId);
    return ResponseUtil.success(res, { bookingSlot, midtransTransaction }, HttpStatus.CREATED);
});

export const getBookingSlotByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const bookingSlot = await getBookingSlotByIdService(id);
    return ResponseUtil.success(res, bookingSlot);
});

export const getBookingSlotsByProductIdController = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const bookingSlots = await getBookingSlotsByProductIdService(productId);
    return ResponseUtil.success(res, bookingSlots);
});

export const updateBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const bookingSlot = await updateBookingSlotService(id, payload);
    return ResponseUtil.success(res, bookingSlot);
});

export const deleteBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const bookingSlot = await deleteBookingSlotService(id);
    return ResponseUtil.success(res, bookingSlot);
});