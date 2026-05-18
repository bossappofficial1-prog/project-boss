import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../errors/app-error";

export const validateSchema = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Coba parse (validasi) bagian request sesuai dengan source (default: body)
      const parsed = schema.parse(req[source]);
      if (source === "body") {
        req.body = parsed;
      } else {
        // req.query and req.params might not be directly assignable in Express
        Object.assign(req[source], parsed);
      }
      next(); // Jika validasi berhasil, lanjutkan ke middleware/controller berikutnya
    } catch (error: any) {
      // Jika terjadi ZodError, teruskan ke middleware penanganan error global.
      if (error instanceof ZodError || error?.name === "ZodError") {
        return next(error);
      }
      console.error("Validation Middleware Error:", error);
      next(new AppError("Kesalahan tak terduga saat validasi input."));
    }
  };
};


