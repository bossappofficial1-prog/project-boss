import { ProductCategoryRepository } from "../repositories/product-category.repository";
import { getOutletByIdService } from "./outlet.service";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import type { CreateProductCategoryInput, UpdateProductCategoryInput } from "../schemas/product-category.schema";

export class ProductCategoryService {
  static async create(data: CreateProductCategoryInput) {
    await getOutletByIdService(data.outletId);
    return ProductCategoryRepository.create(data);
  }

  static async findByOutletId(outletId: string) {
    await getOutletByIdService(outletId);
    return ProductCategoryRepository.findByOutletId(outletId);
  }

  static async update(id: string, data: UpdateProductCategoryInput) {
    const category = await ProductCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Kategori tidak ditemukan", HttpStatus.NOT_FOUND);
    }
    return ProductCategoryRepository.update(id, data);
  }

  static async delete(id: string) {
    const category = await ProductCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Kategori tidak ditemukan", HttpStatus.NOT_FOUND);
    }
    if (category._count.products > 0) {
      throw new AppError(
        "Kategori tidak bisa dihapus karena masih memiliki produk terkait",
        HttpStatus.CONFLICT,
      );
    }
    return ProductCategoryRepository.delete(id);
  }
}
