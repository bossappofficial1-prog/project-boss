import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import {
    createBookingSlotService,
    deleteBookingSlotService,
    getBookingSlotByIdService,
    getBookingSlotByProductService,
    getBookingSlotsByProductIdService,
    updateBookingSlotService
} from "../service/booking.service";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";
import { isBefore, isValid, parseISO, startOfDay } from "date-fns";

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

export const getBookingSlotByOutlet = asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query
    const { productId } = req.params

    // Require date query and parse into a Date object
    if (!date) {
        return ResponseUtil.badRequest(res, "Parameter 'date' wajib diisi");
    }

    const dateString = Array.isArray(date) ? String(date[0]) : String(date);

    // Strict ISO-8601 basic validation:
    const isoRegex = /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?)?$/;
    if (!isoRegex.test(dateString)) {
        return ResponseUtil.badRequest(res, "Format tanggal tidak valid. Gunakan ISO-8601 (contoh: YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ssZ).");
    }

    const parsedDate = parseISO(dateString);
    if (!isValid(parsedDate)) {
        return ResponseUtil.badRequest(res, "Format tanggal tidak valid atau tanggal tidak ada.");
    }

    // Jangan izinkan tanggal sebelum hari ini
    const todayStart = startOfDay(new Date());
    if (isBefore(startOfDay(parsedDate), todayStart)) {
        return ResponseUtil.badRequest(res, "Tanggal tidak boleh sebelum hari ini.");
    }

    const slots = await getBookingSlotByProductService(productId, parsedDate)
    return ResponseUtil.success(res, slots)
})