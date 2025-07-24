import { Response, Request } from "express"
import { ApiResponse, PaginatedResponse } from "../types/response";
import { HttpStatus } from "../constants/http-status";

export class ResponseUtil {
    private static base<T>(
        res: Response,
        success: boolean,
        message: string,
        data: T | null = null,
        statusCode: HttpStatus,
        errors?: any[],
        extra?: Record<string, any>
    ): Response<ApiResponse> {
        return res.status(statusCode).json({
            success,
            message,
            ...(data !== null ? { data } : {}),
            ...(errors ? { errors } : {}),
            ...extra,
            timestamp: new Date().toISOString(),
            path: res.req.originalUrl
        })
    }

    static success<T>(
        res: Response,
        data: T,
        statusCode: HttpStatus = HttpStatus.OK,
        message = "Success"
    ) {
        return this.base(res, true, message, data, statusCode)
    }

    static error(
        res: Response,
        message = 'Internal Server Error',
        errors?: any[],
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    ): Response<ApiResponse<null>> {
        return this.base(res, false, message, null, statusCode, errors);
    }

    static badRequest(
        res: Response,
        message = 'Bad Request',
        errors?: any[]
    ): Response<ApiResponse<null>> {
        return this.base(res, false, message, null, HttpStatus.BAD_REQUEST, errors);
    }

    static unauthorized(
        res: Response,
        message = 'Unauthorized'
    ): Response<ApiResponse<null>> {
        return this.base(res, false, message, null, HttpStatus.UNAUTHORIZED);
    }

    static forbidden(
        res: Response,
        message = 'Forbidden'
    ): Response<ApiResponse<null>> {
        return this.base(res, false, message, null, HttpStatus.FORBIDDEN);
    }

    static notFound(
        res: Response,
        message = 'Not Found'
    ): Response<ApiResponse<null>> {
        return this.base(res, false, message, null, HttpStatus.NOT_FOUND);
    }

    static conflict(
        res: Response,
        message = 'Conflict'
    ): Response<ApiResponse<null>> {
        return this.base(res, false, message, null, HttpStatus.CONFLICT);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        page: number,
        limit: number,
        total: number,
        message = 'Success'
    ): Response<PaginatedResponse<T>> {
        return this.base(res, true, message, data, HttpStatus.OK, undefined, {
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
}