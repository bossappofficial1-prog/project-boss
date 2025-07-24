
import { NextFunction, Request, Response } from "express";
import { createUserService, deleteUserService, getAllUserService, getUserByIdService, updateUserService } from "../service/user.service";
import { ResponseUtil } from "../utils/response";
import { asyncHandler } from "../middleware/error.middleware";
import { HttpStatus } from "../constants/http-status";

export const getAllUserController = asyncHandler(async (req: Request, res: Response) => {
    const users = await getAllUserService()

    return ResponseUtil.success(res, users)
})

export const getUserByIdController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const user = await getUserByIdService(userId)

    return ResponseUtil.success(res, user)
})


export const updateUserController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body
    const userId = req.params.userId
    const user = await updateUserService(userId, payload)

    return ResponseUtil.success(res, user)
})

export const deleteUserController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId
    const user = await deleteUserService(userId)

    return ResponseUtil.success(res, user)
})