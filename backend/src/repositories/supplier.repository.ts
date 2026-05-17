import { db } from "../config/prisma";
import { Prisma } from "@prisma/client";

const supplierInclude = {
  products: {
    include: {
      productGoods: {
        include: {
          product: {
            select: { id: true, name: true, image: true, type: true },
          },
        },
      },
    },
  },
  _count: { select: { products: true } },
} satisfies Prisma.SupplierInclude;

export class SupplierRepository {
  static async findById(id: string) {
    return db.supplier.findUnique({
      where: { id },
      include: supplierInclude,
    });
  }

  static async findAll(query: {
    outletId: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { outletId, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      outletId,
      ...(search?.trim() && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await db.$transaction([
      db.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: supplierInclude,
      }),
      db.supplier.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async create(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    outletId: string;
  }) {
    return db.supplier.create({
      data,
      include: supplierInclude,
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
    },
  ) {
    return db.supplier.update({
      where: { id },
      data,
      include: supplierInclude,
    });
  }

  static async delete(id: string) {
    return db.supplier.delete({ where: { id } });
  }

  static async syncProducts(supplierId: string, productGoodsIds: string[]) {
    await db.supplierProduct.deleteMany({ where: { supplierId } });

    if (productGoodsIds.length > 0) {
      await db.supplierProduct.createMany({
        data: productGoodsIds.map((productGoodsId) => ({
          supplierId,
          productGoodsId,
        })),
      });
    }
  }

  static async findByProduct(productGoodsId: string) {
    return db.supplierProduct.findMany({
      where: { productGoodsId },
      include: { supplier: true },
      orderBy: { lastOrderDate: "desc" },
    });
  }
}
