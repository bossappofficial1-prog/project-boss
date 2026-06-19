import { db } from "../config/prisma";

export class SessionRepository {
  static async create(data: {
    id: string;
    userId: string;
    deviceName?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    ip?: string;
    location?: string;
    isCurrent?: boolean;
    expiresAt: Date;
  }) {
    return db.userSession.create({ data });
  }

  static async findActiveByUserId(userId: string) {
    return db.userSession.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: "desc" },
    });
  }

  static async findById(id: string) {
    return db.userSession.findUnique({ where: { id } });
  }

  static async findByIdAndUser(id: string, userId: string) {
    return db.userSession.findFirst({ where: { id, userId } });
  }

  static async deleteById(id: string) {
    return db.userSession.delete({ where: { id } });
  }

  static async deleteManyByIds(ids: string[]) {
    return db.userSession.deleteMany({ where: { id: { in: ids } } });
  }

  static async updateLastActive(id: string) {
    return db.userSession.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  static async deleteExpiredByUserId(userId: string) {
    return db.userSession.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    });
  }
}
