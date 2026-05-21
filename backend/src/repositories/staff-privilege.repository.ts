import { StaffPrivilegeType } from "@prisma/client";
import { db } from "../config/prisma";

export class StaffPrivilegeRepository {
  static async getByStaffId(staffId: string) {
    return db.staffPrivilege.findMany({
      where: { staffId },
      orderBy: { createdAt: "asc" },
    });
  }

  static async assignPrivileges(staffId: string, privileges: StaffPrivilegeType[]) {
    // Upsert semua privileges yang diberikan
    const ops = privileges.map((privilege) =>
      db.staffPrivilege.upsert({
        where: { staffId_privilege: { staffId, privilege } },
        create: { staffId, privilege },
        update: {},
      }),
    );
    return db.$transaction(ops);
  }

  static async removePrivilege(staffId: string, privilege: StaffPrivilegeType) {
    return db.staffPrivilege.delete({
      where: { staffId_privilege: { staffId, privilege } },
    });
  }

  static async clearAndSet(staffId: string, privileges: StaffPrivilegeType[]) {
    return db.$transaction([
      db.staffPrivilege.deleteMany({ where: { staffId } }),
      ...privileges.map((privilege) =>
        db.staffPrivilege.create({ data: { staffId, privilege } }),
      ),
    ]);
  }

  static async hasPrivilege(staffId: string, privilege: StaffPrivilegeType) {
    const record = await db.staffPrivilege.findUnique({
      where: { staffId_privilege: { staffId, privilege } },
    });
    return !!record;
  }
}
