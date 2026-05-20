import { db } from "../config/prisma";

export class AttendanceRepository {
  static async findByStaffAndDate(staffId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.attendance.findFirst({
      where: {
        staffId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  static async create(data: {
    staffId: string;
    outletId: string;
    date: Date;
    clockIn: Date;
    notes?: string;
    clockInLat?: number | null;
    clockInLng?: number | null;
  }) {
    return db.attendance.create({ data });
  }

  static async clockOut(id: string, data: {
    clockOut: Date;
    notes?: string;
    clockOutLat?: number | null;
    clockOutLng?: number | null;
  }) {
    return db.attendance.update({
      where: { id },
      data,
    });
  }

  static async findMe(staffId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await db.$transaction([
      db.attendance.findMany({
        where: { staffId },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.attendance.count({ where: { staffId } }),
    ]);
    return { data, total };
  }

  static async findAll(params: {
    outletId?: string;
    staffId?: string;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }) {
    const { outletId, staffId, startDate, endDate, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (outletId) where.outletId = outletId;
    if (staffId) where.staffId = staffId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [data, total] = await db.$transaction([
      db.attendance.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          staff: { select: { id: true, name: true, username: true } },
        },
      }),
      db.attendance.count({ where }),
    ]);
    return { data, total };
  }

  static async findOutletById(id: string) {
    return db.outlet.findUnique({
      where: { id },
      select: { id: true, latitude: true, longitude: true },
    });
  }
}
