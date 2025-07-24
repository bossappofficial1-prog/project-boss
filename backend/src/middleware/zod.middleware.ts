import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../errors/app-error";

export const validateSchema = (schema: ZodSchema) => {
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