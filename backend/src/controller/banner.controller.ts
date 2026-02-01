import { Request, Response } from 'express';
import { BannerRepository } from '../repositories/banner.repository';
import { HttpStatus } from '../constants/http-status';
import { ResponseUtil } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { bulkOrderSValues } from '../schemas/banner.schema';
import { AppError } from '../errors/app-error';
import { ImageService } from '../service/image.service';

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
    const banner = await BannerRepository.findById(id as string)

    if (!banner) throw new AppError('Banner tidak ditemukan', HttpStatus.NOT_FOUND);

    const updated = await BannerRepository.update(id as string, req.body as any);

    if (req.body.imageUrl && updated) { await ImageService.deleteImageByUrl(banner.imageUrl); };

    return ResponseUtil.success(res, updated, HttpStatus.OK);
});

export const bulkUpdateBannerController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as bulkOrderSValues
    const updated = await BannerRepository.bulkUpdate(payload);
    return ResponseUtil.success(res, updated, HttpStatus.OK);
});

export const deleteBannerController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await BannerRepository.remove(id as string);

    ImageService.deleteImageByUrl(deleted.imageUrl);
    return res.status(HttpStatus.NO_CONTENT).send();
});
