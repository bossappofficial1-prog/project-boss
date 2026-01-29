import { Product, Prisma, ProductType } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateProductInput, UpdateProductInput } from "../schemas/product.schema";

export class ProductRepository {
  static async findManyByIds(ids: string[]): Promise<Product[]> {
    return db.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        goods: true,
        service: true,
      },
    });
  }

  static async create(data: CreateProductInput): Promise<Product> {
    if (data.type === ProductType.GOODS) {
      return db.product.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          outletId: data.outletId,
          goods: {
            create: {
              currentStock: data.goods.currentStock,
              minStock: data.goods.minStock,
              unit: data.goods.unit,
              averageHpp: data.goods.averageHpp,
              sellingPrice: data.goods.sellingPrice,
            },
          },
        },
        include: {
          goods: true,
        },
      });
    } else {
      // ProductType.SERVICE
      return db.product.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          outletId: data.outletId,
          service: {
            create: {
              durationMinutes: data.service.durationMinutes,
              sellingPrice: data.service.sellingPrice,
              providerName: data.service.providerName,
              providerPhone: data.service.providerPhone,
              providerEmail: data.service.providerEmail,
              commissionType: data.service.commissionType,
              commissionValue: data.service.commissionValue,
              maxParallel: data.service.maxParallel,
            },
          },
        },
        include: {
          service: true,
        },
      });
    }
  }

  static async findById(id: string) {
    return db.product.findUnique({
      where: { id },
      include: {
        goods: true,
        service: {
          include: {
            bookingSlots: {
              where: {
                status: "AVAILABLE",
              },
            },
          },
        },
        productImages: true,
        outlet: {
          select: {
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async findByOutletId(params: {
    outletId: string;
    productType?: ProductType;
    q?: string;
    accessed?: string;
    page: number;
    limit: number;
  }): Promise<{ data: Product[]; total: number }> {
    const { outletId, q, accessed, page, limit, productType } = params;

    const where: Prisma.ProductWhereInput = {
      AND: [
        { outletId },
        ...(q && q !== ""
          ? [
              {
                name: {
                  contains: q,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
            ]
          : [{}]),
        ...(accessed && accessed !== "OWNER"
          ? [{ status: "ACTIVE" } as Prisma.ProductWhereInput]
          : []),
        ...(productType ? [{ type: productType }] : []),
      ],
    };

    const skip = (page - 1) * limit;

    const [data, total] = await db.$transaction([
      db.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          goods: true,
          service: true,
          productImages: true,
        },
      }),
      db.product.count({ where }),
    ]);

    return { data, total };
  }

  static async update(id: string, data: UpdateProductInput): Promise<Product> {
    const updateData: any = {};

    // Update base fields
    if (data.base) {
      if (data.base.name) updateData.name = data.base.name;
      if (data.base.description !== undefined) updateData.description = data.base.description;
      if (data.base.status) updateData.status = data.base.status;
    }

    // Update goods-specific fields
    if (data.goods) {
      updateData.goods = {
        update: data.goods,
      };
    }

    // Update service-specific fields
    if (data.service) {
      updateData.service = {
        update: data.service,
      };
    }

    return db.product.update({
      where: { id },
      data: updateData,
      include: {
        goods: true,
        service: true,
      },
    });
  }

  static async delete(id: string): Promise<Product> {
    return db.product.delete({
      where: { id },
    });
  }

  static async searchByName(name: string): Promise<Product[]> {
    return db.product.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive" as Prisma.QueryMode,
        },
      },
      include: {
        goods: true,
        service: true,
      },
    });
  }
}
