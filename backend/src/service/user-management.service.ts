import { BaseService } from './base.service';
import { UserRepository, UserFilters } from '../repositories/user.repository';
import { AuditLogService } from './audit-log.service';
import { UserStatus, AuditAction, AuditEntityType } from '@prisma/client';

export class UserManagementService extends BaseService {
  constructor(
    private userRepository: UserRepository,
    private auditLogService: AuditLogService,
  ) {
    super();
  }

  async getAll(filters: UserFilters) {
    return this.userRepository.findAll(filters);
  }

  async getById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) this.notFound('User tidak ditemukan');
    return user;
  }

  async suspendUser(userId: string, performedBy: string, reason?: string, ipAddress?: string) {
    const user = await this.getById(userId);

    if (user.status === UserStatus.SUSPENDED) {
      this.badRequest('User sudah dalam status suspended');
    }

    if (user.role === 'ADMIN') {
      this.badRequest('Tidak bisa suspend admin');
    }

    const updated = await this.userRepository.updateStatus(userId, UserStatus.SUSPENDED);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.USER_SUSPENDED,
      AuditEntityType.USER,
      userId,
      user.name,
      { reason, email: user.email },
      ipAddress,
    );

    return {
      message: `User ${user.name} berhasil disuspend`,
      user: updated,
    };
  }

  async reactivateUser(userId: string, performedBy: string, ipAddress?: string) {
    const user = await this.getById(userId);

    if (user.status === UserStatus.ACTIVE) {
      this.badRequest('User sudah dalam status aktif');
    }

    const updated = await this.userRepository.updateStatus(userId, UserStatus.ACTIVE);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.USER_REACTIVATED,
      AuditEntityType.USER,
      userId,
      user.name,
      { email: user.email },
      ipAddress,
    );

    return {
      message: `User ${user.name} berhasil diaktifkan kembali`,
      user: updated,
    };
  }

  async deleteUser(userId: string, performedBy: string, ipAddress?: string) {
    const user = await this.getById(userId);

    if (user.role === 'ADMIN') {
      this.badRequest('Tidak bisa hapus admin');
    }

    if (user.business) {
      this.badRequest('Tidak bisa hapus user yang memiliki bisnis. Hapus bisnis terlebih dahulu.');
    }

    await this.userRepository.delete(userId);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.USER_DELETED,
      AuditEntityType.USER,
      userId,
      user.name,
      { email: user.email },
      ipAddress,
    );

    return { message: `User ${user.name} berhasil dihapus` };
  }

  async bulkSuspend(userIds: string[], performedBy: string, reason?: string, ipAddress?: string) {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const userId of userIds) {
      try {
        await this.suspendUser(userId, performedBy, reason, ipAddress);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${userId}: ${error.message}`);
      }
    }

    return {
      message: `Bulk suspend selesai: ${results.success} berhasil, ${results.failed} gagal`,
      ...results,
    };
  }

  async bulkReactivate(userIds: string[], performedBy: string, ipAddress?: string) {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const userId of userIds) {
      try {
        await this.reactivateUser(userId, performedBy, ipAddress);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${userId}: ${error.message}`);
      }
    }

    return {
      message: `Bulk reactivate selesai: ${results.success} berhasil, ${results.failed} gagal`,
      ...results,
    };
  }

  async getStats() {
    return this.userRepository.getStats();
  }
}
