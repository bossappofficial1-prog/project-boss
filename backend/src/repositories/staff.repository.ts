import { Staff } from "@prisma/client";
import { db } from "../config/prisma";
import { BcryptUtil } from "../utils";
import {
  StaffFormValues,
  UpdateStaffSchemaValues,
} from "../schemas/staff.schema";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export class StaffRepository {
  static async create(data: StaffFormValues): Promise<Staff> {
    const staffData = { ...data };
    // Hash password jika ada
    if (staffData.password) {
      staffData.password = await BcryptUtil.hash(staffData.password);
    }

    // Normalize username: empty string -> null
    if (
      !staffData.username ||
      (typeof staffData.username === "string" && !staffData.username.trim())
    ) {
      staffData.username = null;
    }

    if (staffData.username) {
      const existingStaff = await db.staff.findUnique({
        where: { username: staffData.username },
      });
      if (existingStaff) {
        throw new AppError(
          "Username sudah terdaftar dengan akun lain.",
          HttpStatus.CONFLICT,
        );
      }
    }

    return db.staff.create({
      data: staffData,
    });
  }

  static async findById(id: string) {
    return db.staff.findUnique({
      where: { id },
      include: {
        outlet: true,
      },
    });
  }

  static async findByOutletId(outletId: string): Promise<Staff[]> {
    return db.staff.findMany({
      where: { outletId },
      orderBy: { name: "asc" },
    });
  }

  static async update(
    id: string,
    data: UpdateStaffSchemaValues,
  ): Promise<Staff> {
    const staffData = { ...data };

    // Hash password jika ada dan diubah
    if (staffData.password && staffData.password !== "") {
      staffData.password = await BcryptUtil.hash(staffData.password);
    }

    // Cek duplikat username jika diisi
    const incomingUsername = staffData.username;
    if (incomingUsername !== undefined) {
      if (
        !incomingUsername ||
        (typeof incomingUsername === "string" && !incomingUsername.trim())
      ) {
        staffData.username = null;
      } else {
        const existing = await db.staff.findUnique({
          where: { username: incomingUsername },
        });
        if (existing && existing.id !== id) {
          throw new AppError(
            "Username sudah terdaftar dengan akun lain.",
            HttpStatus.CONFLICT,
          );
        }
      }
    }

    return db.staff.update({
      where: { id },
      data: {
        name: staffData.name,
        phone: staffData.phone,
        status: staffData.status,
        username: staffData.username,
        outletId: staffData.outletId,
        createdAt: staffData.createdAt,
        updatedAt: staffData.updatedAt,
        ...(staffData.password && staffData.password !== ""
          ? { password: staffData.password }
          : {}),
      },
    });
  }

  static async delete(id: string): Promise<Staff> {
    return db.staff.delete({
      where: { id },
    });
  }

  static async findByUsername(username: string) {
    return db.staff.findUnique({
      where: { username },
      include: {
        outlet: {
          include: {
            business: true,
          },
        },
      },
    });
  }
}
