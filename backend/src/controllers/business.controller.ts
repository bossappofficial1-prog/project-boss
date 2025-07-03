import { NextFunction, Request, Response } from "express";
import { getAllBusiness, getBusinessDetailService, getBusinessProductService, getBusinessService } from "../services/business.service";
import { ResponseUtil } from "../utils/response.util";
import { getBusinessWalletService } from "../services/wallet.service";
import { createOutletService } from "../services/outlet.service";
import { config } from "../configs/config";
import { asyncHandler } from "../middlewares/error.middleware";

// GET ALL BUSINESSES
export const getAllBusinessesController = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search } = req.query;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 10;
    const searchTerm = typeof search === "string" ? search : '';

    const businesses = await getAllBusiness(pageNumber, limitNumber, searchTerm);
    return ResponseUtil.paginated(res, businesses, pageNumber, limitNumber, (pageNumber * limitNumber), "berhasil mengambil data");
});

// GET PRODUCTS BY BUSINESS
export const getBusinessProductController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const products = await getBusinessProductService(id);

    return ResponseUtil.success(res, products);
});

// GET BUSINESS DETAIL
export const getBusinessDetailController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const business = await getBusinessDetailService(id);

    return ResponseUtil.success(res, business);
});

// GET BUSINESS WALLET
export const getBusinessWalletController = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;
    const wallet = await getBusinessWalletService(user?.id!);

    return ResponseUtil.success(res, wallet);
});

// CREATE OUTLET FOR BUSINESS
export const createBusinessOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { businessId } = req.params;
    const file = req.file;
    const { address, name, phone } = req.body;

    const image = `${config.BASE_URL}/outlets/${file?.filename}`;
    const newOutlet = await createOutletService(businessId, {
        address,
        image,
        name,
        phone
    });

    return ResponseUtil.success(res, newOutlet, 'success', 201);
});