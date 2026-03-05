import { Product, Prisma, ProductType } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateProductInput, UpdateProductInput } from "../schemas/product.schema";

export class ProductRepository {
  static async findManyByIds(ids: string[]) {
    return db.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        goods: true,
        service: true,
        ticket: true,
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
    } else if (data.type === ProductType.SERVICE) {
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
              bookingInWorkHours: data.service.bookingInWorkHours,
              // Operating hours
              mondayOpen: data.service.mondayOpen,
              mondayClose: data.service.mondayClose,
              tuesdayOpen: data.service.tuesdayOpen,
              tuesdayClose: data.service.tuesdayClose,
              wednesdayOpen: data.service.wednesdayOpen,
              wednesdayClose: data.service.wednesdayClose,
              thursdayOpen: data.service.thursdayOpen,
              thursdayClose: data.service.thursdayClose,
              fridayOpen: data.service.fridayOpen,
              fridayClose: data.service.fridayClose,
              saturdayOpen: data.service.saturdayOpen,
              saturdayClose: data.service.saturdayClose,
              sundayOpen: data.service.sundayOpen,
              sundayClose: data.service.sundayClose,
            },
          },
        },
        include: {
          service: true,
        },
      });
    } else {
      // ProductType.TICKET
      return db.product.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          outletId: data.outletId,
          image: data.image,
          ticket: {
            create: {
              sellingPrice: data.ticket.sellingPrice,
              eventDate: data.ticket.eventDate,
              eventEndDate: data.ticket.eventEndDate,
              venue: data.ticket.venue,
              venueAddress: data.ticket.venueAddress,
              mapUrl: data.ticket.mapUrl,
              totalQuota: data.ticket.totalQuota,
              maxPerOrder: data.ticket.maxPerOrder,
              saleStartDate: data.ticket.saleStartDate,
              saleEndDate: data.ticket.saleEndDate,
              terms: data.ticket.terms,
            },
          },
        },
        include: {
          ticket: true,
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
        ticket: true,
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
        {
          OR: [
            { outletId },
            { outlet: { slug: outletId } },
          ]
        },

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
          ticket: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.product.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Updates product base info and its relational data (goods/service).
   */
  static async update(id: string, data: UpdateProductInput): Promise<Product> {
    const { goods, service, type, ...rest } = data;

    // Construct the update object for Prisma nested update
    // Only include the base product fields, not the entire baseData spread
    const updateData: Prisma.ProductUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.image !== undefined && { image: data.image }),
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

    if ((data as any).ticket) {
      updateData.ticket = {
        update: (data as any).ticket,
      };
    }

    return db.product.update({
      where: { id },
      data: updateData,
      include: {
        goods: true,
        service: true,
        ticket: true,
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
        ticket: true,
      },
    });
  }

  static async findForExport(
    outletId: string,
    filters?: { type?: "GOODS" | "SERVICE" | "TICKET"; search?: string },
  ) {
    const where: Prisma.ProductWhereInput = { outletId };
    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { goods: true, service: true, ticket: true },
    });
  }
}
