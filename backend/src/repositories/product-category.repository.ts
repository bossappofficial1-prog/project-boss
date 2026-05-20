import { db } from "../config/prisma";
import type { CreateProductCategoryInput, UpdateProductCategoryInput } from "../schemas/product-category.schema";

export class ProductCategoryRepository {
  static async create(data: CreateProductCategoryInput) {
    return db.productCategory.create({ data });
  }

  static async findById(id: string) {
    return db.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
  }

  static async findByOutletId(outletId: string) {
    return db.productCategory.findMany({
      where: { outletId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  }

  static async update(id: string, data: UpdateProductCategoryInput) {
    return db.productCategory.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return db.productCategory.delete({ where: { id } });
  }
}
