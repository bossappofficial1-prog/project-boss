import { User } from "@prisma/client";
import { db } from "../config/prisma";
import { UpdateProfileValues } from "../schemas/profile-setting.schema";

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: User["role"];
  isVerified: boolean;
  avatar: string | null;
  bussiness?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  static async findById(id: string) {
    return await db.user.findUnique({
      where: { id },
      select: {
        name: true,
        id: true,
        email: true,
        avatar: true,
        password: true,
        role: true,
        isVerified: true,
        verificationCode: true,
        verificationCodeExpires: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        provider: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
        status: true,

        business: {
          select: {
            id: true,
            name: true,
            description: true,
            bankAccount: true,
            bankName: true,
            accountHolder: true,
            subscriptionEndDate: true,
            subscriptionPlan: true,
            subscriptionStartDate: true,
            subscriptionStatus: true,
            outlets: {
              select: {
                id: true,
                name: true,
                businessId: true,
                slug: true,
                address: true,
                image: true,
                description: true,
                isOpen: true,
                latitude: true,
                longitude: true,
                instagramUrl: true,
                manualQrImageUrl: true,
                qrisString: true,
                type: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
  }

  static async updateProfile(userId: string, data: UpdateProfileValues) {
    return db.user.update({
      where: { id: userId },
      data,
    });
  }

  static async updatePassword(userId: string, newPassword: string) {
    return db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  }

  static async getById(userId: string) {
    return db.$transaction(async (trx) => {
      const user = await trx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          email: true,
          isVerified: true,
          phone: true,
          business: {
            select: {
              id: true,
              name: true,
              description: true,
              bankName: true,
              bankAccount: true,
              accountHolder: true,
              subscriptionStatus: true,
              subscriptionPlan: true,
              subscriptionEndDate: true,
            },
          },
        },
      });

      const recentInvoice = await trx.subscriptionInvoice.findMany({
        where: { businessId: user?.business?.id },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      return { user, recentInvoice };
    });
  }

  static async detail(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            description: true,
            bankName: true,
            bankAccount: true,
            accountHolder: true,
            subscriptionEndDate: true,
            subscriptionPlan: true,
            subscriptionStartDate: true,
            subscriptionStatus: true,
            _count: { select: { outlets: true } },
          },
        },
      },
    });
  }

  static async findByEmail(email: string, ignoreUserId?: string) {
    return db.user.findFirst({
      where: {
        email,
        ...(ignoreUserId ? { NOT: { id: ignoreUserId } } : {}),
      },
      include: { business: true },
    });
  }

  static async create(
    data: Pick<User, "name" | "email" | "password"> & Partial<User>,
  ) {
    return db.user.create({
      data,
      include: { business: true },
    });
  }

  static async createByAdmin(
    data: Pick<User, "name" | "email" | "password" | "role">,
  ) {
    return db.user.create({ data });
  }

  static async updateByAdmin(userId: string, data: Partial<User>) {
    return db.user.update({ where: { id: userId }, data });
  }

  static async createGoogleUser(
    data: Pick<
      User,
      | "name"
      | "email"
      | "password"
      | "googleId"
      | "avatar"
      | "provider"
      | "isVerified"
      | "role"
    >,
  ) {
    return db.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        verificationCode: true,
        verificationCodeExpires: true,
        phone: true,
        googleId: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        business: {
          select: {
            id: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
      },
    });
  }

  static async update(
    id: string,
    data: Partial<
      Pick<
        User,
        | "name"
        | "googleId"
        | "password"
        | "provider"
        | "isVerified"
        | "verificationCode"
        | "verificationCodeExpires"
        | "twoFactorEnabled"
        | "twoFactorSecret"
        | "backupCodes"
      >
    >,
  ) {
    return db.user.update({
      where: { id },
      data,
      include: { business: { select: { id: true } } },
    });
  }

  static async delete(id: string): Promise<User> {
    return db.user.delete({
      where: { id },
    });
  }

  static async findAll() {
    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        provider: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        business: true,
      },
    });
  }

  static async findAllPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<SafeUser>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);

    const skip = (safePage - 1) * limit;

    const normalizedSearch = search?.trim();
    // Build where clause for search
    const where = normalizedSearch
      ? {
          OR: [
            {
              name: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : undefined;

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "email",
    ] as const;

    type SortField = (typeof allowedSortFields)[number];

    const sortField: SortField = allowedSortFields.includes(sortBy as SortField)
      ? (sortBy as SortField)
      : "createdAt";

    const orderBy = {
      [sortField]: sortOrder === "asc" ? "asc" : "desc",
    };

    const [total, data] = await db.$transaction([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          provider: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          business: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: skip + data.length < total,
      hasPrevPage: safePage > 1,
    };
  }

  static async findByGoogleId(googleId: string) {
    return db.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        verificationCode: true,
        verificationCodeExpires: true,
        phone: true,
        googleId: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        business: {
          select: {
            id: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
      },
    });
  }
}
