import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

/**
 * Base Service — semua service WAJIB extends class ini.
 *
 * Menyediakan helper methods untuk throw error yang konsisten:
 * - `notFound()` → 404
 * - `badRequest()` → 400
 * - `conflict()` → 409
 * - `forbidden()` → 403
 * - `unauthorized()` → 401
 *
 * @example
 * ```typescript
 * export class ProductService extends BaseService {
 *   static async getById(id: string) {
 *     const product = await ProductRepository.findById(id);
 *     if (!product) this.notFound("Produk tidak ditemukan");
 *     return product;
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  protected static notFound(message = "Data tidak ditemukan"): never {
    throw new AppError(message, HttpStatus.NOT_FOUND);
  }

  protected static badRequest(message: string): never {
    throw new AppError(message, HttpStatus.BAD_REQUEST);
  }

  protected static conflict(message: string): never {
    throw new AppError(message, HttpStatus.CONFLICT);
  }

  protected static forbidden(message: string): never {
    throw new AppError(message, HttpStatus.FORBIDDEN);
  }

  protected static unauthorized(message: string): never {
    throw new AppError(message, HttpStatus.UNAUTHORIZED);
  }
}
