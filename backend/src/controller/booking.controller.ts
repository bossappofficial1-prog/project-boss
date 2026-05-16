import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import {
  createBookingSlotService,
  deleteBookingSlotService,
  getAvailableStaffForProductSlotService,
  getBookingCalendarService,
  getBookingSlotByIdService,
  getBookingSlotByProductService,
  getBookingSlotsByProductServiceIdService,
  updateBookingSlotService,
} from "../service/booking.service";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";
import { BookingRepository } from "../repositories/booking.repository";
import { getProductByIdService } from "../service/product.service";
import { AppError } from "../errors/app-error";
import { isBefore, isValid, startOfDay } from "date-fns";
import { HttpStatus } from "../constants/http-status";
import { ensureString } from "../utils/request";

export const createBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
  const payload: CreateBookingSlotInput = req.body;
  const bookingSlot = await createBookingSlotService(payload);
  return ResponseUtil.success(res, bookingSlot);
});

export const getBookingSlotByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  const slot = await getBookingSlotByIdService(id);
  return ResponseUtil.success(res, slot);
});

export const getBookingSlotsByProductIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = ensureString(req.params?.productId, "productId");

    // Get product to extract productServiceId
    const product = await getProductByIdService(productId);

    if (product.type !== "SERVICE") {
      throw new AppError("Product is not a service", HttpStatus.BAD_REQUEST);
    }

    const productServiceId = (product as any).service?.id;
    if (!productServiceId) {
      throw new AppError("Product service data not found", HttpStatus.NOT_FOUND);
    }

    const slots = await getBookingSlotsByProductServiceIdService(productServiceId);
    return ResponseUtil.success(res, slots);
  },
);

const ensureStringQuery = (value: unknown, name: string): string => {
  if (!value) {
    throw new AppError(`Parameter '${name}' wajib diisi`, HttpStatus.BAD_REQUEST);
  }

  const normalized = Array.isArray(value) ? value[0] : value;
  if (typeof normalized !== "string" || normalized.trim() === "") {
    throw new AppError(`Parameter '${name}' tidak valid`, HttpStatus.BAD_REQUEST);
  }

  return normalized;
};

const parseDateTimeFromParams = (dateStr: string, timeValue: string, label: string): Date => {
  const trimmed = timeValue.trim();

  const isIsoDateTime = /^\d{4}-\d{2}-\d{2}T/.test(trimmed);
  const candidate = isIsoDateTime
    ? new Date(trimmed)
    : new Date(`${dateStr}T${trimmed.length === 5 ? `${trimmed}:00` : trimmed}`);

  if (Number.isNaN(candidate.getTime())) {
    throw new AppError(`Format ${label} tidak valid`, HttpStatus.BAD_REQUEST);
  }

  return candidate;
};

export const getAvailableStaffForProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = ensureString(req.params?.productId, "productId");
    const { date, startTime, endTime, slotId } = req.query;

    if (!date && !slotId) {
      return ResponseUtil.badRequest(res, "Parameter 'date' atau 'slotId' wajib diisi");
    }

    let outletId: string;
    let startDateTime: Date;
    let endDateTime: Date;
    let excludeSlotId: string | undefined;

    if (slotId) {
      const slotIdValue = ensureStringQuery(slotId, "slotId");
      const slot = await BookingRepository.findWithProduct(slotIdValue);

      if (!slot) {
        throw new AppError("Slot tidak ditemukan", HttpStatus.NOT_FOUND);
      }

      if (slot.productService?.productId !== productId) {
        throw new AppError("Slot tidak sesuai dengan produk", HttpStatus.BAD_REQUEST);
      }

      outletId = slot.productService.product.outletId;
      startDateTime = new Date(slot.startTime);
      endDateTime = new Date(slot.endTime);
      excludeSlotId = slotIdValue;
    } else {
      const product = await getProductByIdService(productId);

      if (product.type !== "SERVICE") {
        throw new AppError("Produk ini bukan layanan", HttpStatus.BAD_REQUEST);
      }

      const dateValue = ensureStringQuery(date, "date");
      const startValue = ensureStringQuery(startTime, "startTime");
      const endValue = ensureStringQuery(endTime, "endTime");

      outletId = product.outletId;
      startDateTime = parseDateTimeFromParams(dateValue, startValue, "startTime");
      endDateTime = parseDateTimeFromParams(dateValue, endValue, "endTime");
    }

    const staff = await getAvailableStaffForProductSlotService({
      productId,
      outletId,
      startTime: startDateTime,
      endTime: endDateTime,
      excludeSlotId,
    });

    return ResponseUtil.success(res, {
      staff,
      window: {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      },
      slotId: excludeSlotId ?? null,
    });
  },
);

export const updateBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  const payload: UpdateBookingSlotInput = req.body;
  const bookingSlot = await updateBookingSlotService(id, payload);
  return ResponseUtil.success(res, bookingSlot);
});

export const getBookingCalendarController = asyncHandler(async (req: Request, res: Response) => {
  const { outletId } = req.params
  const { startDate, endDate, productServiceId, providerName } = req.query

  const data = await getBookingCalendarService(
    outletId as string,
    startDate as unknown as Date,
    endDate as unknown as Date,
    productServiceId as string,
    providerName as string
  )

  return ResponseUtil.success(res, data, HttpStatus.OK, "Kalender booking berhasil diambil")
})

export const deleteBookingSlotController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params?.id, "id");
  await deleteBookingSlotService(id);
  return ResponseUtil.success(res, { message: "Booking slot deleted successfully." });
});

export const getBookingSlotByOutlet = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const productId = ensureString(req.params?.productId, "productId");

  // Require date query and parse into a Date object
  if (!date) {
    return ResponseUtil.badRequest(res, "Parameter 'date' wajib diisi");
  }

  const dateString = Array.isArray(date) ? String(date[0]) : String(date);

  // Strict ISO-8601 basic validation:
  const isoRegex =
    /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?)?$/;
  if (!isoRegex.test(dateString)) {
    return ResponseUtil.badRequest(
      res,
      "Format tanggal tidak valid. Gunakan ISO-8601 (contoh: YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ssZ).",
    );
  }

  const parsedDate = new Date(dateString);
  if (!isValid(parsedDate)) {
    return ResponseUtil.badRequest(res, "Format tanggal tidak valid atau tanggal tidak ada.");
  }

  // Jangan izinkan tanggal sebelum hari ini
  const todayStart = startOfDay(new Date());
  if (isBefore(startOfDay(parsedDate), todayStart)) {
    return ResponseUtil.badRequest(res, "Tanggal tidak boleh sebelum hari ini.");
  }

  const slots = await getBookingSlotByProductService(productId, parsedDate);
  return ResponseUtil.success(res, slots);
});
