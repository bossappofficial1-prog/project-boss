import { ApiResponse, PaginatedResponse } from "@/types/response.types";
import { Response } from "express";

export class ResponseUtil {
    static success<T>(
        res: Response,
        data: T,
        message: string = 'success',
        statusCode: number = 200,
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            path: res.req.url
        })
    }

    static error(
        res: Response,
        message: string = 'Internal Server Error',
        statusCode: number = 500,
        errors?: any[]
    ): Response<ApiResponse> {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: res.req.url
        });
    }

    static paginated<T>(
        res: Response,
        data: T[],
        page: number,
        limit: number,
        total: number,
        message: string = 'Success'
    ): Response<PaginatedResponse<T>> {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            timestamp: new Date().toISOString(),
            path: res.req.url
        });
    }

    static unauthorized(
        res: Response,
        message: string = 'Unauthorized'
    ): Response<ApiResponse> {
        return res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString(),
            path: res.req.url
        });
    }

    static forbidden(
        res: Response,
        message: string = 'Forbidden'
    ): Response<ApiResponse> {
        return res.status(403).json({
            success: false,
            message,
            timestamp: new Date().toISOString(),
            path: res.req.url
        });
    }

    static notFound(
        res: Response,
        message: string = 'Not Found'
    ): Response<ApiResponse> {
        return res.status(404).json({
            success: false,
            message,
            timestamp: new Date().toISOString(),
            path: res.req.url
        });
    }
}