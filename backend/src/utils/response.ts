import { Response } from "express"
import { ApiResponse, PaginatedResponse } from "../types/response";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";

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
            ...(data !== null ? { data: this.sanitizeBigInt(data) } : {}),
            ...(errors ? { errors } : {}),
            ...extra,
            timestamp: new Date().toISOString(),
            path: res.req.originalUrl
        })
    }

    private static sanitizeBigInt(obj: any): any {
        // Preserve Date instances as ISO strings
        if (obj instanceof Date) {
            return obj.toISOString();
        }
        if (typeof obj === 'bigint') {
            // ubah ke string supaya aman
            return obj.toString();
        } else if (Array.isArray(obj)) {
            return obj.map((item) => ResponseUtil.sanitizeBigInt(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, ResponseUtil.sanitizeBigInt(v)])
            );
        }
        return obj;
    }

    static success<T>(
        res: Response,
        data: T,
        statusCode: HttpStatus = HttpStatus.OK,
        message: any = Messages.SUCCESS
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
        message: any = 'Success'
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