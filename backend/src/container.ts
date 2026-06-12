import { createContainer, asClass, InjectionMode, AwilixContainer } from 'awilix';
import { db } from './config/prisma';

// Repositories
import { AdminRepository } from './repositories/admin.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { ReportRepository } from './repositories/report.repository';
import { PlatformSettingRepository } from './repositories/platform-setting.repository';
import { UserManagementRepository } from './repositories/user-management.repository';

// Services
import { AdminService } from './service/admin.service';
import { AuditLogService } from './service/audit-log.service';
import { ReportService } from './service/report.service';
import { PlatformSettingService } from './service/platform-setting.service';
import { UserManagementService } from './service/user-management.service';
import { AdminAnalyticsService } from './service/admin-analytics.service';

// Controllers
import { AdminController } from './controller/admin.controller';
import { AuditLogController } from './controller/audit-log.controller';
import { ReportController } from './controller/admin-report.controller';
import { PlatformSettingController } from './controller/platform-setting.controller';
import { UserManagementController } from './controller/user-management.controller';

export interface Cradle {
  db: typeof db;

  // Repositories
  adminRepository: AdminRepository;
  auditLogRepository: AuditLogRepository;
  reportRepository: ReportRepository;
  platformSettingRepository: PlatformSettingRepository;
  userManagementRepository: UserManagementRepository;

  // Services
  adminService: AdminService;
  auditLogService: AuditLogService;
  reportService: ReportService;
  platformSettingService: PlatformSettingService;
  userManagementService: UserManagementService;
  adminAnalyticsService: AdminAnalyticsService;

  // Controllers
  adminController: AdminController;
  auditLogController: AuditLogController;
  reportController: ReportController;
  platformSettingController: PlatformSettingController;
  userManagementController: UserManagementController;
}

export function createAppContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    // Database
    db: asClass(Object).singleton(),

    // Repositories
    adminRepository: asClass(AdminRepository).singleton(),
    auditLogRepository: asClass(AuditLogRepository).singleton(),
    reportRepository: asClass(ReportRepository).singleton(),
    platformSettingRepository: asClass(PlatformSettingRepository).singleton(),
    userManagementRepository: asClass(UserManagementRepository).singleton(),

    // Services
    adminService: asClass(AdminService).singleton(),
    auditLogService: asClass(AuditLogService).singleton(),
    reportService: asClass(ReportService).singleton(),
    platformSettingService: asClass(PlatformSettingService).singleton(),
    userManagementService: asClass(UserManagementService).singleton(),
    adminAnalyticsService: asClass(AdminAnalyticsService).singleton(),

    // Controllers
    adminController: asClass(AdminController).singleton(),
    auditLogController: asClass(AuditLogController).singleton(),
    reportController: asClass(ReportController).singleton(),
    platformSettingController: asClass(PlatformSettingController).singleton(),
    userManagementController: asClass(UserManagementController).singleton(),
  });

  // Override db registration with actual prisma instance
  container.register({
    db: asClass(
      class { 
        constructor() { return db; }
      }
    ).singleton(),
  });

  return container;
}

let container: AwilixContainer<Cradle>;

export function getContainer(): AwilixContainer<Cradle> {
  if (!container) {
    container = createAppContainer();
  }
  return container;
}

export { container };
