
import { NextFunction, Request, Response } from "express";
import { createUserService, deleteUserService, getAllUserService, getUserByIdService, updateUserService } from "../service/user.service";
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

export const createUserController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = await createUserService(payload)

    return ResponseUtil.success(res, user, 201)
})