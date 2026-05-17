import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";

/**
 * Base Controller — semua controller WAJIB extends class ini.
 *
 * Menyediakan:
 * - `handler()` untuk wrap async handler dengan error catching
 * - `success()` untuk response sukses
 * - `paginated()` untuk response dengan pagination
 * - `error()` untuk response error manual
 *
 * @example
 * ```typescript
 * class ProductController extends BaseController {
 *   getAll = this.handler(async (req, res) => {
 *     const data = await ProductService.getAll(req.query);
 *     return this.success(res, data);
 *   });
 * }
 * export const productController = new ProductController();
 * ```
 */
export abstract class BaseController {
  /**
   * Wrap handler function dengan asyncHandler untuk error catching otomatis
   */
  protected handler(fn: (req: Request, res: Response) => Promise<any>) {
    return asyncHandler(fn);
  }

  /**
   * Response sukses standar
   */
  protected success(
    res: Response,
    data: any,
    statusCode: HttpStatus = HttpStatus.OK,
    message?: string,
  ) {
    return ResponseUtil.success(res, data, statusCode, message);
  }

  /**
   * Response dengan pagination
   */
  protected paginated(
    res: Response,
    data: any[],
    page: number,
    limit: number,
    total: number,
    extra?: {
      totalPages?: number;
      hasNextPage?: boolean;
      hasPrevPage?: boolean;
    },
  ) {
    return ResponseUtil.paginated(res, data, page, limit, total, extra);
  }

  /**
   * Response error manual (biasanya pakai AppError throw saja)
   */
  protected error(
    res: Response,
    message: string,
    errors?: any[],
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    return ResponseUtil.error(res, message, errors, statusCode);
  }
}
