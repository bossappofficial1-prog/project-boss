import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./error.middleware";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { config } from "../config";

/**
 * Middleware untuk mengamankan rute API internal (server-to-server).
 * Memeriksa header X-Internal-Key atau query parameter apiKey.
 */
export const protectInternal = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.headers["x-internal-key"];
    const apiKeyQuery = req.query.apiKey;

    const key = apiKeyHeader || apiKeyQuery;

    if (!key || key !== config.INTERNAL_API_KEY) {
      throw new AppError(
        "Akses ditolak: API Key internal tidak valid atau tidak disediakan.",
        HttpStatus.FORBIDDEN
      );
    }

    next();
  }
);
