import { db } from "../config/prisma";
import { CreateTableInput, UpdateTableInput } from "../schemas/table.schema";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { getOutletByIdService } from "./outlet.service";

const TABLE_ENABLED_OUTLET_TYPES = new Set(["FNB", "CUSTOM"]);

async function ensureOutletSupportsTableFeature(outletId: string) {
  const outlet = await getOutletByIdService(outletId);
  if (!TABLE_ENABLED_OUTLET_TYPES.has(outlet.type)) {
    throw new AppError(
      "Fitur meja hanya tersedia untuk outlet tipe F&B atau Custom.",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TableService {
  static async create(data: CreateTableInput) {
    await ensureOutletSupportsTableFeature(data.outletId);

    return db.outletTable.create({
      data,
    });
  }

  static async findAll(outletId: string) {
    await ensureOutletSupportsTableFeature(outletId);

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
        outlet: {
          select: {
            type: true,
          },
        },
        orders: {
          where: { orderStatus: { notIn: ["COMPLETED", "CANCELLED"] } },
          include: { guestCustomer: true }
        }
      }
    });
    if (!table) throw new AppError("Meja tidak ditemukan", HttpStatus.NOT_FOUND);
    if (!TABLE_ENABLED_OUTLET_TYPES.has(table.outlet.type)) {
      throw new AppError(
        "Fitur meja hanya tersedia untuk outlet tipe F&B atau Custom.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const { outlet: _outlet, ...tableData } = table;
    return tableData;
  }

  static async update(id: string, data: UpdateTableInput) {
    const existingTable = await db.outletTable.findUnique({
      where: { id },
      include: {
        outlet: {
          select: {
            type: true,
          },
        }
      }
    });
    if (!existingTable) throw new AppError("Meja tidak ditemukan", HttpStatus.NOT_FOUND);
    if (!TABLE_ENABLED_OUTLET_TYPES.has(existingTable.outlet.type)) {
      throw new AppError(
        "Fitur meja hanya tersedia untuk outlet tipe F&B atau Custom.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return db.outletTable.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const existingTable = await db.outletTable.findUnique({
      where: { id },
      include: {
        outlet: {
          select: {
            type: true,
          },
        },
      },
    });
    if (!existingTable) throw new AppError("Meja tidak ditemukan", HttpStatus.NOT_FOUND);
    if (!TABLE_ENABLED_OUTLET_TYPES.has(existingTable.outlet.type)) {
      throw new AppError(
        "Fitur meja hanya tersedia untuk outlet tipe F&B atau Custom.",
        HttpStatus.BAD_REQUEST,
      );
    }

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
