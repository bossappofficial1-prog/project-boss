import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { MemberService } from "../service/member.service";
import {
  CreateMemberInput,
  IncreasePointInput,
  UpdateMemberInput,
  getMemberByIdQuerySchema,
  getMembersByOutletQuerySchema,
} from "../schemas/member.schema";
import { MemberRepository } from "../repositories/member.repository";

export const createMemberController = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateMemberInput;

  try {
    const member = await MemberService.createMember(payload);
    return ResponseUtil.success(res, member, HttpStatus.CREATED);
  } catch (err: any) {
    if (err.message === "PHONE_TAKEN") {
      throw new AppError("Nomor telepon sudah terdaftar", HttpStatus.CONFLICT);
    }
    throw err;
  }
});

export const getMembersByOutletController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = req.params.outletId as string;
  const query = getMembersByOutletQuerySchema.parse(req.query);

  const result = await MemberService.getMembersByOutlet(outletId, query);
  return ResponseUtil.success(res, result);
});

export const getMemberByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const query = getMemberByIdQuerySchema.parse(req.query);

  const member = await MemberService.getMemberById(id, query.outletId);

  if (!member) {
    throw new AppError("Member tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  return ResponseUtil.success(res, member);
});

export const updateMemberController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const payload = req.body as UpdateMemberInput;

  const existing = await MemberRepository.findById(id);
  if (!existing) {
    throw new AppError("Member tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  try {
    const updated = await MemberService.updateMember(id, payload);
    return ResponseUtil.success(res, updated);
  } catch (err: any) {
    if (err.message === "PHONE_TAKEN") {
      throw new AppError("Nomor telepon sudah digunakan member lain", HttpStatus.CONFLICT);
    }
    throw err;
  }
});

export const increasePointController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const payload = req.body as IncreasePointInput;

  const member = await MemberRepository.findById(id);
  if (!member) {
    throw new AppError("Member tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const membership = await MemberService.increasePoint(id, payload.orderId, payload.point);
  return ResponseUtil.success(res, membership);
});

export const deleteMemberController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const member = await MemberRepository.findById(id);
  if (!member) {
    throw new AppError("Member tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  await MemberService.deleteMember(id);
  return ResponseUtil.success(res, { message: "Member berhasil dihapus" });
});
