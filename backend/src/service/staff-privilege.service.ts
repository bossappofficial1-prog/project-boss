import { StaffPrivilegeType } from "@prisma/client";
import { BaseService } from "./base.service";
import { StaffPrivilegeRepository } from "../repositories/staff-privilege.repository";
import { StaffRepository } from "../repositories/staff.repository";

export class StaffPrivilegeService extends BaseService {
  static async getPrivileges(staffId: string) {
    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan");
    return StaffPrivilegeRepository.getByStaffId(staffId);
  }

  static async assignPrivileges(staffId: string, privileges: StaffPrivilegeType[]) {
    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan");

    if (staff.role !== "MANAGER") {
      this.badRequest("Hanya Manager yang dapat memiliki privileges");
    }

    return StaffPrivilegeRepository.assignPrivileges(staffId, privileges);
  }

  static async removePrivilege(staffId: string, privilege: StaffPrivilegeType) {
    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Staff tidak ditemukan");

    const exists = await StaffPrivilegeRepository.hasPrivilege(staffId, privilege);
    if (!exists) this.notFound("Privilege tidak ditemukan");

    return StaffPrivilegeRepository.removePrivilege(staffId, privilege);
  }
}
