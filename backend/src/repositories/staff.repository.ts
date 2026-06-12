import { Staff, StaffPrivilegeType } from "@prisma/client";
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
    const { privileges, ...staffData } = data as any;

    // Hash PIN
    if (staffData.pin) {
      staffData.pin = await BcryptUtil.hash(staffData.pin);
    }

    // Normalize username: empty string -> null
    if (
      !staffData.username ||
      (typeof staffData.username === "string" && !staffData.username.trim())
    ) {
      staffData.username = null;
    }

    // Validasi username unik jika diisi
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

    if (!staffData.outletId) {
      throw new AppError("Outlet ID tidak boleh kosong", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const created = await db.staff.create({
      data: {
        name: staffData.name,
        phone: staffData.phone || null,
        username: staffData.username || null,
        email: staffData.email || null,
        pin: staffData.pin || null,
        role: staffData.role || "CASHIER",
        status: staffData.status || "ACTIVE",
        outletId: staffData.outletId,
        faceImageUrl: staffData.faceImageUrl || null,
        faceDescriptor: staffData.faceDescriptor || null,
      },
    });

    // Assign privileges jika ada
    if (privileges && privileges.length > 0) {
      await db.staffPrivilege.createMany({
        data: privileges.map((p: StaffPrivilegeType) => ({
          staffId: created.id,
          privilege: p,
        })),
        skipDuplicates: true,
      });
    }

    return created;
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

  /**
   * Public endpoint for portal - returns only safe fields
   * Excludes: pin, phone, email, privileges, and other sensitive data
   */
  static async findPublicByOutletId(outletId: string) {
    return db.staff.findMany({
      where: { outletId },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        faceImageUrl: true,
        faceDescriptor: true,
      },
      orderBy: { name: "asc" },
    });
  }

  static async update(
    id: string,
    data: UpdateStaffSchemaValues,
  ): Promise<Staff> {
    const { privileges, ...staffData } = data as any;

    // Hash PIN jika ada dan diubah
    if (staffData.pin) {
      staffData.pin = await BcryptUtil.hash(staffData.pin);
    } else {
      delete staffData.pin;
    }

    // Convert empty string for optional fields to null to avoid unique constraints and validation issues
    if (staffData.phone === "") {
      staffData.phone = null;
    }
    if (staffData.email === "") {
      staffData.email = null;
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
