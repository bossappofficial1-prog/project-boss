import { Product, Prisma, ProductType } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateProductInput, UpdateProductInput } from "../schemas/product.schema";

export class ProductRepository {
  /**
   * Finds multiple products by their IDs, including type-specific details.
   */
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

  /**
   * Creates a new product and its associated Goods or Service record.
   */
  static async create(data: CreateProductInput): Promise<Product> {
    if (data.type === ProductType.GOODS) {
      return db.product.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          outletId: data.outletId,
          image: data.image,
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
          image: data.image,
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

  /**
   * Finds a specific product by ID with full relations and availability slots.
   */
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

  /**
   * Paginated search for products within an outlet.
   */
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
          : []),
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.product.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Updates product base info and its relational data (goods/service).
   */
  static async update(id: string, data: UpdateProductInput): Promise<Product> {
    const { goods, service, ...baseData } = data;

    // Construct the update object for Prisma nested update
    const updateData: Prisma.ProductUpdateInput = {
      ...baseData,
    };

    if (goods) {
      updateData.goods = {
        update: goods,
      };
    }

    if (service) {
      updateData.service = {
        update: service,
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

  /**
   * Deletes a product.
   */
  static async delete(id: string): Promise<Product> {
    return db.product.delete({
      where: { id },
    });
  }

  /**
   * Search helper specifically for name-based lookups.
   */
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