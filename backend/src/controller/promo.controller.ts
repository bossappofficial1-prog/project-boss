import { Request, Response } from 'express';
import * as promoService from '../service/promo.service';
import { HttpStatus } from '../constants/http-status';
import { asyncHandler } from '../middleware/error.middleware';

export const createPromoHandler = asyncHandler(async (req: Request, res: Response) => {
    const promo = await promoService.createPromo(req.body);
    res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Promo created successfully',
        data: promo,
    });
});

export const getPromosByBusinessHandler = asyncHandler(async (req: Request, res: Response) => {
    const { businessId } = req.params;
    const promos = await promoService.getPromosByBusiness(businessId);
    res.status(HttpStatus.OK).json({
        success: true,
        message: 'Promos retrieved successfully',
        data: promos,
    });
});

export const getPromoByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { promoId } = req.params;
    const promo = await promoService.getPromoById(promoId);
    res.status(HttpStatus.OK).json({
        success: true,
        message: 'Promo retrieved successfully',
        data: promo,
    });
});

export const applyPromoHandler = asyncHandler(async (req: Request, res: Response) => {
    const { promoCode, orderId } = req.body;
    const result = await promoService.applyPromoToOrder(promoCode, orderId);
    res.status(HttpStatus.OK).json({
        success: true,
        message: 'Promo applied successfully',
        data: result,
    });
});
