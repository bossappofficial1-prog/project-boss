import { Staff, StaffPrivilegeType } from "@prisma/client";
import { db } from "../config/prisma";
import { BcryptUtil } from "../utils";
import { StaffFormValues, UpdateStaffSchemaValues } from "../schemas/staff.schema";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export class StaffRepository {
  static async create(data: StaffFormValues): Promise<Staff> {
    const { privileges, ...staffData } = data as any;

    // Hash password jika ada (untuk kasir)
    if (staffData.password) {
      staffData.password = await BcryptUtil.hash(staffData.password);
    }

    // Hash PIN jika ada (untuk manager)
    if (staffData.pin) {
      staffData.pin = await BcryptUtil.hash(staffData.pin);
    }

    // Validasi username unik jika diisi
    if (staffData.username) {
      const existingStaff = await db.staff.findFirst({
        where: { username: staffData.username },
      });
      if (existingStaff) {
        throw new AppError("Username sudah terdaftar dengan akun lain.", HttpStatus.CONFLICT);
      }
    }

    // Create staff + privileges dalam satu transaksi
    const staff = await db.$transaction(async (tx) => {
      const created = await tx.staff.create({
        data: {
          name: staffData.name,
          phone: staffData.phone || null,
          username: staffData.username || null,
          password: staffData.password || "",
          email: staffData.email || null,
          pin: staffData.pin || null,
          role: staffData.role || "CASHIER",
          status: staffData.status || "ACTIVE",
          outletId: staffData.outletId,
        },
      });

      // Assign privileges jika manager
      if (privileges && privileges.length > 0) {
        await tx.staffPrivilege.createMany({
          data: privileges.map((p: StaffPrivilegeType) => ({
            staffId: created.id,
            privilege: p,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return staff;
  }

  static async findById(id: string) {
    return db.staff.findUnique({
      where: { id },
      include: {
        outlet: {
          include: {
            business: true,
          },
        },
        privileges: true,
      },
    });
  }

  static async findByOutletId(outletId: string) {
    return db.staff.findMany({
      where: { outletId },
      include: { privileges: true },
      orderBy: { name: "asc" },
    });
  }

  static async update(id: string, data: UpdateStaffSchemaValues): Promise<Staff> {
    const { privileges, ...staffData } = data as any;

    // Hash password jika ada dan diubah
    if (staffData.password) {
      staffData.password = await BcryptUtil.hash(staffData.password);
    } else {
      delete staffData.password;
    }

    // Hash PIN jika ada dan diubah
    if (staffData.pin) {
      staffData.pin = await BcryptUtil.hash(staffData.pin);
    } else {
      delete staffData.pin;
    }

    // Convert empty string for optional fields to null to avoid unique constraints and validation issues
    if (staffData.username === "") {
      staffData.username = null;
    }
    if (staffData.phone === "") {
      staffData.phone = null;
    }
    if (staffData.email === "") {
      staffData.email = null;
    }

    // Validasi username unik jika diisi dan bukan milik staff ini
    if (staffData.username) {
      const existingStaff = await db.staff.findFirst({
        where: {
          username: staffData.username,
          id: { not: id },
        },
      });
      if (existingStaff) {
        throw new AppError("Username sudah terdaftar dengan akun lain.", HttpStatus.CONFLICT);
      }
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.staff.update({
        where: { id },
        data: staffData,
      });

      // Update privileges jika diberikan
      if (privileges !== undefined) {
        await tx.staffPrivilege.deleteMany({ where: { staffId: id } });
        if (privileges.length > 0) {
          await tx.staffPrivilege.createMany({
            data: privileges.map((p: StaffPrivilegeType) => ({
              staffId: id,
              privilege: p,
            })),
            skipDuplicates: true,
          });
        }
      }

      return updated;
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
          include: { business: true },
        },
        privileges: true,
      },
    });
  }

  /**
   * Cari Manager berdasarkan nama dan outletId (untuk manager login)
   * Nama bisa match dengan `name` field (case-insensitive)
   */
  static async findManagerByName(name: string, outletId?: string) {
    return db.staff.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        role: "MANAGER",
        ...(outletId ? { outletId } : {}),
      },
      include: {
        outlet: {
          include: { business: true },
        },
        privileges: true,
      },
    });
  }
}
