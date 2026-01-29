import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    createBusinessService,
    getAllBusinessesService,
    getBusinessByIdService,
    getBusinessByOwnerIdService,
    updateBusinessService,
    updateBankAccountService,
    BusinessAdminService
} from "../service/business.service";
import { Messages } from "../constants/message";
import { $Enums } from "@prisma/client";

export const getAllBusinessesController = asyncHandler(async (req: Request, res: Response) => {
    const businesses = await getAllBusinessesService();
    return ResponseUtil.success(res, businesses);
});

export const getKPIsBusinessesController = asyncHandler(async (req: Request, res: Response) => {
    const businesses = await BusinessAdminService.getKPIsData();
    return ResponseUtil.success(res, businesses);
});

export const exportTenantDataController = asyncHandler(async (req: Request, res: Response) => {
    const workbook = await BusinessAdminService.exportTenantData();

    const fileName = `Tenant_Management _Export_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);

    res.end()
});

export const getAllBusinessesAdminController = asyncHandler(async (req: Request, res: Response) => {
    const { name, status } = req.query
    const businesses = await BusinessAdminService.findAll(
        {
            name: name as string,
            ...(status !== 'ALL' ? { status: status as $Enums.SubscriptionStatus } : {}),
        });
    return ResponseUtil.success(res, businesses);
});

export const getBusinessByIdController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const business = await getBusinessByIdService(id);
    return ResponseUtil.success(res, business);
});

export const createBusinessController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const business = await createBusinessService(payload, ownerId);
    return ResponseUtil.success(res, business, HttpStatus.CREATED);
});

export const getMyBusinessController = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.storedUser!.id;
    const business = await getBusinessByOwnerIdService(ownerId);
    return ResponseUtil.success(res, business);
});

export const updateBusinessController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const business = await updateBusinessService(id, payload, ownerId);
    ResponseUtil.success(res, business, HttpStatus.OK, Messages.UPDATED);
});

export const updateBankAccountController = asyncHandler(async (req: Request, res: Response) => {
    const { bankName, bankAccount, accountHolder } = req.body;
    const business = await updateBankAccountService(req.params.id as string, req.storedUser?.id!, { bankName, bankAccount, accountHolder });
    ResponseUtil.success(res, business, HttpStatus.OK, "Informasi rekening bank berhasil diperbarui.");
});