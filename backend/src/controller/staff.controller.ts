import { Request, Response } from "express";
import { StaffRepository } from "../repositories/staff.repository";
import { HttpStatus } from "../constants/http-status";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { AppError } from "../errors/app-error";
import {
  StaffFormValues,
  UpdateStaffSchemaValues,
} from "../schemas/staff.schema";
import { getOutletByIdService } from "../service/outlet.service";
import { PlanLimitService } from "../service/plan-limit.service";
import {
  importStaffFromCSV,
  generateStaffImportTemplate,
  StaffImportRow,
} from "../service/staff.service";

export const createStaffController = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = req.body as StaffFormValues;
    const storedUser = req.storedUser as typeof req.storedUser & {
      businessId?: string;
    };
    const businessId = storedUser?.businessId;

    if (!businessId) {
      throw new AppError("Business ID tidak ditemukan", HttpStatus.FORBIDDEN);
    }

    const outlet = await getOutletByIdService(payload.outletId);
    if (outlet.businessId !== businessId) {
      throw new AppError(
        "Outlet tidak termasuk dalam bisnis Anda",
        HttpStatus.FORBIDDEN,
      );
    }

    await PlanLimitService.assertCanCreateStaff(businessId);
    const staff = await StaffRepository.create(payload);
    await PlanLimitService.invalidateUsageCache(businessId);
    return ResponseUtil.success(res, staff, HttpStatus.CREATED);
  },
);

export const getStaffByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const staff = await StaffRepository.findById(id as string);

    if (!staff) {
      throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    return ResponseUtil.success(res, staff);
  },
);

export const getStaffByOutletController = asyncHandler(
  async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const staff = await StaffRepository.findByOutletId(outletId as string);
    return ResponseUtil.success(res, staff);
  },
);

export const updateStaffController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateStaffSchemaValues;

    const staff = await StaffRepository.findById(id as string);
    if (!staff) {
      throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const updatedStaff = await StaffRepository.update(id as string, payload);
    return ResponseUtil.success(res, updatedStaff);
  },
);

export const deleteStaffController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const staff = await StaffRepository.findById(id as string);
    if (!staff) {
      throw new AppError("Staff tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    const storedUser = req.storedUser as typeof req.storedUser & {
      businessId?: string;
    };
    const businessId = storedUser?.businessId;

    if (!businessId) {
      throw new AppError("Business ID tidak ditemukan", HttpStatus.FORBIDDEN);
    }

    if (staff.outlet?.businessId !== businessId) {
      throw new AppError(
        "Anda tidak berhak menghapus staff pada outlet ini",
        HttpStatus.FORBIDDEN,
      );
    }

    await StaffRepository.delete(id as string);
    await PlanLimitService.invalidateUsageCache(businessId);
    return ResponseUtil.success(res, { message: "Staff berhasil dihapus" });
  },
);

export const downloadStaffImportTemplateController = asyncHandler(
  async (req: Request, res: Response) => {
    const workbook = await generateStaffImportTemplate();
    const filename = "template-import-staff.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  },
);

export const importStaffController = asyncHandler(
  async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
      businessId?: string;
    };
    const businessId = storedUser?.businessId;
    const { outletId, rows } = req.body;

    if (!businessId) {
      throw new AppError("Business ID tidak ditemukan", HttpStatus.FORBIDDEN);
    }

    if (!outletId) {
      throw new AppError("Outlet ID wajib diisi", HttpStatus.BAD_REQUEST);
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new AppError("Data staff kosong", HttpStatus.BAD_REQUEST);
    }

    // Verify outlet belongs to business
    const outlet = await getOutletByIdService(outletId);
    if (outlet.businessId !== businessId) {
      throw new AppError(
        "Outlet tidak termasuk dalam bisnis Anda",
        HttpStatus.FORBIDDEN,
      );
    }

    // Check plan limit for total staff to be created
    await PlanLimitService.assertCanCreateStaff(businessId);

    const result = await importStaffFromCSV(
      businessId,
      outletId,
      rows as StaffImportRow[],
    );

    // Invalidate cache after bulk import
    await PlanLimitService.invalidateUsageCache(businessId);

    return ResponseUtil.success(
      res,
      result,
      HttpStatus.CREATED,
      `Import selesai: ${result.success} berhasil, ${result.failed} gagal`,
    );
  },
);
