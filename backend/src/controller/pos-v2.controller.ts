import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { PosV2Service } from "../service/pos-v2.service";
import { CreatePosV2OrderInput } from "../schemas/pos-v2.schema";
import {
    getBookingSlotByProductService,
    getAvailableStaffForProductSlotService,
} from "../service/booking.service";
import { BookingRepository } from "../repositories/booking.repository";
import { getProductByIdService } from "../service/product.service";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export const posV2GetProducts = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.query.outletId as string;
    const search = req.query.search as string | undefined;
    const type = req.query.type as "GOODS" | "SERVICE" | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50; // default 50 for POS screen

    if (!outletId) {
        return ResponseUtil.badRequest(res, "Parameter outletId wajib diisi");
    }

    const { data: products, meta } = await PosV2Service.getProducts(outletId, search, type, page, limit);
    return ResponseUtil.success(res, { products, meta });
});

export const posV2CreateOrder = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreatePosV2OrderInput;
    const user = req.storedUser;

    let cashierId: string | null = null;
    if (user && (user as any).userType === "CASHIER") {
        cashierId = user.id;
    }

    const result = await PosV2Service.createOrder(payload, cashierId);
    return ResponseUtil.success(res, result, 201, "Pesanan berhasil dibuat");
});

export const posV2GetCashSummary = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.query.outletId as string;

    if (!outletId) {
        return ResponseUtil.badRequest(res, "Parameter outletId wajib diisi");
    }

    const summary = await PosV2Service.getCashSummary(outletId);
    return ResponseUtil.success(res, summary);
});

export const posV2GetRecentOrders = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.query.outletId as string;

    if (!outletId) {
        return ResponseUtil.badRequest(res, "Parameter outletId wajib diisi");
    }

    const orders = await PosV2Service.getRecentOrders(outletId);
    return ResponseUtil.success(res, orders);
});

export const posV2GetBookingSlots = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const date = req.query.date as string;

    if (!productId) {
        return ResponseUtil.badRequest(res, "Parameter productId wajib diisi");
    }
    if (!date) {
        return ResponseUtil.badRequest(res, "Parameter date wajib diisi (format: YYYY-MM-DD)");
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        return ResponseUtil.badRequest(res, "Format tanggal tidak valid");
    }

    const slots = await getBookingSlotByProductService(productId, parsedDate);
    return ResponseUtil.success(res, slots);
});

export const posV2GetAvailableStaff = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const slotId = req.query.slotId as string;

    if (!productId) {
        return ResponseUtil.badRequest(res, "Parameter productId wajib diisi");
    }
    if (!slotId) {
        return ResponseUtil.badRequest(res, "Parameter slotId wajib diisi");
    }

    const slot = await BookingRepository.findWithProduct(slotId);
    if (!slot) {
        throw new AppError("Slot tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const product = await getProductByIdService(productId);

    const staff = await getAvailableStaffForProductSlotService({
        productId,
        outletId: product.outletId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        excludeSlotId: slotId,
    });

    return ResponseUtil.success(res, { staff, slotId });
});
