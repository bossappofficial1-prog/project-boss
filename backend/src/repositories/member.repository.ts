import { db } from "../config/prisma";
import { CreateMemberInput, UpdateMemberInput } from "../schemas/member.schema";

export class MemberRepository {
  static async create(data: CreateMemberInput) {
    return db.guestCustomer.create({ data });
  }

  static async findById(id: string) {
    return db.guestCustomer.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { order: true },
          orderBy: { joinedAt: "desc" },
        },
      },
    });
  }

  static async findByPhone(phone: string) {
    return db.guestCustomer.findUnique({ where: { phone } });
  }

  static async findByOutletId(outletId: string, search?: string, skip = 0, take = 20) {
    const whereSearch = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const where = {
      orders: { some: { outletId } },
      ...whereSearch,
    };

    const [members, total] = await Promise.all([
      db.guestCustomer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          memberships: {
            orderBy: { joinedAt: "desc" },
            take: 1,
          },
          _count: { select: { orders: true } },
        },
      }),
      db.guestCustomer.count({ where }),
    ]);

    return { members, total };
  }

  static async update(id: string, data: UpdateMemberInput) {
    return db.guestCustomer.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return db.guestCustomer.delete({ where: { id } });
  }

  static async findMembership(guestCustomerId: string, orderId: string) {
    return db.membership.findUnique({
      where: { guestCustomerId_orderId: { guestCustomerId, orderId } },
    });
  }

  static async increasePoint(guestCustomerId: string, orderId: string, point: number) {
    return db.membership.upsert({
      where: { guestCustomerId_orderId: { guestCustomerId, orderId } },
      update: { point: { increment: point } },
      create: { guestCustomerId, orderId, point },
    });
  }

  static async getTotalPoint(guestCustomerId: string) {
    const result = await db.membership.aggregate({
      where: { guestCustomerId },
      _sum: { point: true },
    });
    return result._sum.point ?? 0;
  }
}
