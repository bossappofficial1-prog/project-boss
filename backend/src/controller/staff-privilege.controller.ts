import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { HttpStatus } from "../constants/http-status";
import { StaffPrivilegeService } from "../service/staff-privilege.service";
import { assignPrivilegesSchema, removePrivilegeSchema } from "../schemas/staff-privilege.schema";
import { StaffPrivilegeType } from "@prisma/client";

export const getStaffPrivilegesController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const privileges = await StaffPrivilegeService.getPrivileges(id);
  return ResponseUtil.success(res, privileges, HttpStatus.OK, "Berhasil mengambil daftar privileges");
});

export const assignPrivilegesController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const validated = assignPrivilegesSchema.parse(req.body);
  const result = await StaffPrivilegeService.assignPrivileges(id, validated.privileges);
  return ResponseUtil.success(res, result, HttpStatus.OK, "Privileges berhasil ditetapkan");
});

export const removePrivilegeController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const type = req.params.type as string;
  const validated = removePrivilegeSchema.parse({ type });
  await StaffPrivilegeService.removePrivilege(id, validated.type as StaffPrivilegeType);
  return ResponseUtil.success(res, null, HttpStatus.OK, "Privilege berhasil dihapus");
});
