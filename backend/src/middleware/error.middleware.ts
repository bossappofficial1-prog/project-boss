import { Request, Response, NextFunction } from "express";
import { ResponseUtil } from "../utils/response";
import logger from "../utils/winston.logger";
import { AppError } from "../errors/app-error";
// import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { HttpStatus } from "../constants/http-status";

export const notFound = (req: Request, res: Response): void => {
    ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = Messages.INTERNAL_ERROR;
    let errors: any[] | undefined;

    // ─── Handle Zod Validation Error ─────────────────────────────────
    if (err instanceof ZodError) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Invalid input data.";
        errors = err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message
        }));
    }

    // ─── JWT Errors ─────────────────────────────────────────────────
    else if (err.name === 'JsonWebTokenError') {
        statusCode = HttpStatus.UNAUTHORIZED;
        message = "Invalid token";
    } else if (err.name === 'TokenExpiredError') {
        statusCode = HttpStatus.UNAUTHORIZED;
        message = "Token expired";
    }

    // ─── Multer Error (File Upload) ─────────────────────────────────
    else if (err instanceof MulterError) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = err.message || "File upload failed";
    } else if (err.message?.startsWith("File type")) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = err.message;
    }

    else if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                statusCode = HttpStatus.CONFLICT;
                message = 'Unique constraint failed (duplicate data)';
                break;
            case 'P2025':
                statusCode = HttpStatus.NOT_FOUND;
                message = 'Record not found';
                break;
            default:
                message = `Database error: ${err.message}`;
        }
    }

    // ─── AppError (Custom Error) ────────────────────────────────────
    else if (err instanceof AppError) {
        statusCode = err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
        message = err.message;
        errors = err.errors;
    }

    // ─── Body Parser JSON Syntax Error ──────────────────────────────
    else if (err instanceof SyntaxError && 'body' in err) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Invalid JSON in request body';
    }

    // ─── Log Error ──────────────────────────────────────────────────
    logger.error('Unhandled Error', {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode,
    });

    // ─── Send Error Response ────────────────────────────────────────
    ResponseUtil.error(res, message, errors, statusCode);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};