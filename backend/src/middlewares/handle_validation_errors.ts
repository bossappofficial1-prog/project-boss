import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ResponseApiType } from "../types/api_types";
import { ResponseUtil } from "../utils/response.util";
import logger from "../utils/logger.util";
import { deleteFile } from "../configs/multer";

export async function handleValidationErrors(req: Request, res: Response<ResponseApiType>, next: NextFunction) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        if (req.file) {
            const fieldToFolderMap: Record<string, string> = {
                avatar: "avatars",
                image: "outlets",
                image_product: "products"
            };

            const folder = fieldToFolderMap[req.file.fieldname]

            await deleteFile(folder, req.file.filename)
        }
        logger.error(`Error: Validation required when accessing ${req.baseUrl}${req.path}`);
        return ResponseUtil.error(res, 'Validation required', 400, errors.array())
    }

    return next()
}