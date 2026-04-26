import { db } from "../config/prisma";
import { CreateTableInput, UpdateTableInput } from "../schemas/table.schema";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export class TableService {
  static async create(data: CreateTableInput) {
    return db.outletTable.create({
      data,
    });
  }

  static async findAll(outletId: string) {
    return db.outletTable.findMany({
      where: { outletId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { orders: { where: { orderStatus: { notIn: ["COMPLETED", "CANCELLED"] } } } }
        }
      }
    });
  }

  static async findById(id: string) {
    const table = await db.outletTable.findUnique({
      where: { id },
      include: {
        orders: {
          where: { orderStatus: { notIn: ["COMPLETED", "CANCELLED"] } },
          include: { guestCustomer: true }
        }
      }
    });
    if (!table) throw new AppError("Meja tidak ditemukan", HttpStatus.NOT_FOUND);
    return table;
  }

  static async update(id: string, data: UpdateTableInput) {
    return db.outletTable.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    // Check if there are active orders
    const activeOrders = await db.order.count({
      where: {
        tableId: id,
        orderStatus: { notIn: ["COMPLETED", "CANCELLED"] }
      }
    });

    if (activeOrders > 0) {
      throw new AppError("Meja tidak bisa dihapus karena masih ada pesanan aktif", HttpStatus.BAD_REQUEST);
    }

    return db.outletTable.delete({
      where: { id },
    });
  }
}
