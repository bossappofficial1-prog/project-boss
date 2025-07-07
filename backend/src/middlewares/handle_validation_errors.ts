import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ResponseApiType } from "../types/api_types";
import { ResponseUtil } from "../utils/response.util";
import logger from "../utils/logger.util";
import { deleteFile } from "../configs/multer";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../errors/api_errors";

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

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Coba parse (validasi) req.body dengan skema yang diberikan
            // Jika validasi gagal, Zod akan melemparkan ZodError
            schema.parse(req.body);
            next(); // Jika validasi berhasil, lanjutkan ke middleware/controller berikutnya
        } catch (error: any) {
            // Jika terjadi ZodError, teruskan ke middleware penanganan error global.
            // Middleware global di server.ts akan bertanggung jawab untuk memformat responsnya.
            if (error instanceof ZodError) {
                return next(error); // Teruskan ZodError ke middleware penanganan error
            }
            // Jika ini bukan ZodError tapi error lain yang tidak terduga dalam validasi
            next(new AppError('Kesalahan tak terduga saat validasi input.'));
        }
    };
}