import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger.util";
import { ResponseUtil } from "../utils/response.util";
import { AppError } from "../errors/api_errors";

export interface CustomError extends Error {
    statusCode?: number,
    isOperational?: boolean
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error'

    if (err.message.startsWith("File type")) {
        message = err.message;
        statusCode = 400;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    if (err instanceof AppError) {
        message = err.message;
        statusCode = err.statusCode!;
    }

    logger.error(message, { statusCode })

    ResponseUtil.error(res, message, statusCode);
}

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};