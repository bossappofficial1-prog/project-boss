import { BaseService } from './base.service';
import { AuditLogRepository, CreateAuditLogInput, AuditLogFilters } from '../repositories/audit-log.repository';
import { AuditAction, AuditEntityType } from '@prisma/client';

export class AuditLogService extends BaseService {
  constructor(private auditLogRepository: AuditLogRepository) {
    super();
  }

  async log(input: CreateAuditLogInput) {
    return this.auditLogRepository.create(input);
  }

  async logAdminAction(
    performedBy: string,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    entityName?: string,
    details?: Record<string, any>,
    ipAddress?: string,
  ) {
    return this.log({
      action,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress,
      performedBy,
    });
  }

  async getAll(filters: AuditLogFilters) {
    return this.auditLogRepository.findAll(filters);
  }

  async getByEntity(entityType: AuditEntityType, entityId: string) {
    return this.auditLogRepository.findByEntity(entityType, entityId);
  }

  async getStats() {
    return this.auditLogRepository.getStats();
  }
}
