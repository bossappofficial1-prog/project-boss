import { Request, Response } from 'express';
import { BannerRepository } from '../repositories/banner.repository';
import { HttpStatus } from '../constants/http-status';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getBannersController = asyncHandler(async (req: Request, res: Response) => {
    const banners = await BannerRepository.findAllBanner();
    return ResponseUtil.success(res, banners, HttpStatus.OK);
});

export const createBannerController = asyncHandler(async (req: Request, res: Response) => {
    const created = await BannerRepository.create(req.body as any);
    return ResponseUtil.success(res, created, HttpStatus.CREATED);
});

export const updateBannerController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await BannerRepository.update(id as string, req.body as any);
    return ResponseUtil.success(res, updated, HttpStatus.OK);
});

export const deleteBannerController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await BannerRepository.remove(id as string);
    return res.status(HttpStatus.NO_CONTENT).send();
});
