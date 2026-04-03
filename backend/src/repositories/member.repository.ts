import { db } from "../config/prisma";
import { CreateMemberInput, UpdateMemberInput } from "../schemas/member.schema";

export class MemberRepository {
  static async create(data: CreateMemberInput) {
    return db.guestCustomer.create({ data });
  }

  static async findById(id: string, outletId?: string) {
    return db.guestCustomer.findFirst({
      where: {
        id,
        ...(outletId ? { orders: { some: { outletId } } } : {}),
      },
      include: {
        orders: {
          ...(outletId ? { where: { outletId } } : {}),
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            totalAmount: true,
            orderStatus: true,
            paymentStatus: true,
            createdAt: true,
            outletId: true,
          },
        },
        memberships: {
          ...(outletId ? { where: { order: { outletId } } } : {}),
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
    const guestFilter = search
      ? {
        OR: [
          { guestCustomer: { name: { contains: search, mode: "insensitive" as const } } },
          { guestCustomer: { phone: { contains: search, mode: "insensitive" as const } } },
        ],
      }
      : {};

    const [latestOrders, total] = await Promise.all([
      db.order.findMany({
        where: {
          outletId,
          ...guestFilter,
        },
        orderBy: { createdAt: "desc" },
        distinct: ["guestCustomerId"],
        skip,
        take,
        select: {
          guestCustomerId: true,
        },
      }),
      db.guestCustomer.count({
        where: {
          orders: {
            some: {
              outletId,
            },
          },
          ...(search
            ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
              ],
            }
            : {}),
        },
      }),
    ]);

    const customerIds = latestOrders.map((order) => order.guestCustomerId);

    if (customerIds.length === 0) {
      return { members: [], total };
    }

    const [members, orderCounts] = await Promise.all([
      db.guestCustomer.findMany({
        where: {
          id: { in: customerIds },
        },
        include: {
          orders: {
            where: { outletId },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              createdAt: true,
            },
          },
          memberships: {
            where: { order: { outletId } },
            orderBy: { joinedAt: "desc" },
            take: 1,
          },
          _count: { select: { orders: true } },
        },
      }),
      db.order.groupBy({
        by: ["guestCustomerId"],
        where: {
          outletId,
          guestCustomerId: { in: customerIds },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const countMap = new Map(orderCounts.map((entry) => [entry.guestCustomerId, entry._count._all]));
    const memberMap = new Map(members.map((member) => [member.id, member]));

    const orderedMembers = customerIds
      .map((id) => memberMap.get(id))
      .filter(Boolean)
      .map((member: any) => ({
        ...member,
        _count: {
          ...member._count,
          orders: countMap.get(member.id) ?? 0,
        },
      }));

    return { members: orderedMembers, total };
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

  static async getTotalPoint(guestCustomerId: string, outletId?: string) {
    const result = await db.membership.aggregate({
      where: {
        guestCustomerId,
        ...(outletId ? { order: { outletId } } : {}),
      },
      _sum: { point: true },
    });
    return result._sum.point ?? 0;
  }
}
