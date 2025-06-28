import { Response } from "express";
import { ResponseApiType } from "../types/api_types";
import { ResponseUtil } from "../utils/response.util";
import logger from "../utils/logger.util";

export class AppError extends Error {
    public errors?: any[];
    public statusCode?: number;

    constructor(messsage: string, statusCode?: number, errors?: any[]) {
        super(messsage)
        this.errors = errors;
        this.statusCode = statusCode;

        Object.setPrototypeOf(this, AppError.prototype)
        Error.captureStackTrace(this, this.constructor)
    }
}

export const handlerAnyError = (error: any, res: Response<ResponseApiType>) => {
    if (error instanceof AppError) {
        return ResponseUtil.error(res, error.message, error.statusCode, error.errors)
    }

    console.log(error)
    logger.error("error",)
    return ResponseUtil.error(res)
}