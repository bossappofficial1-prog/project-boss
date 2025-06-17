import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ResponseApiType } from "../types/api_types";
import { ResponseUtil } from "@/utils/response.util";

export function handleValidationErrors(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation required', 400, errors.array())
    }

    return next()
}