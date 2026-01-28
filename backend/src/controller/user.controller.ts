
import { NextFunction, Request, Response } from "express";
import { createUserByAdmin, createUserService, deleteUserService, getAllUserService, getUserByIdService, getUserDetailService, updateUserService } from "../service/user.service";
import { ResponseUtil } from "../utils/response";
import { asyncHandler } from "../middleware/error.middleware";
import { PaginationParams } from "../repositories/user.repository";

export const getAllUserController = asyncHandler(async (req: Request, res: Response) => {
    // Extract pagination parameters from query
    const {
        page = '1',
        limit = '10',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const paginationParams: PaginationParams = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await getAllUserService(paginationParams);
    return ResponseUtil.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        {
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
        }
    );
})

export const getUserByIdController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string
    const user = await getUserByIdService(userId)

    return ResponseUtil.success(res, user)
})

export const getUserDetailController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string
    const user = await getUserDetailService(userId)

    return ResponseUtil.success(res, user)
})


export const updateUserController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body
    const userId = req.params.userId as string
    const user = await updateUserService(userId, payload)

    return ResponseUtil.success(res, user)
})

export const deleteUserController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string
    const storedUserId = req.storedUser?.id

    if (userId === storedUserId) {
        return ResponseUtil.error(res, 'Tidak mendapatkan menghapus akun anda sendiri', [], 400)
    }
    const user = await deleteUserService(userId as string)

    return ResponseUtil.success(res, user)
})

export const createUserController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const actor = req.storedUser?.role
    const user = await createUserService(payload, actor)

    return ResponseUtil.success(res, user, 201)
})

export const createUserByAdminController = asyncHandler(async (req: Request, res: Response) => {
    const dtoUser = req.body

    const result = await createUserByAdmin(dtoUser);

    return ResponseUtil.success(res, result, 201)
})