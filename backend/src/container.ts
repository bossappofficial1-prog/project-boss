import { createContainer, asClass, asValue, InjectionMode, AwilixContainer } from 'awilix';
import { db } from './config/prisma';

// Repositories
import { AdminRepository } from './repositories/admin.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { ReportRepository } from './repositories/report.repository';
import { AdminReportRepository } from './repositories/admin-report.repository';
import { PlatformSettingRepository } from './repositories/platform-setting.repository';
import { UserManagementRepository } from './repositories/user-management.repository';
import { BusinessManagementRepository } from './repositories/business-management.repository';
import { AdminSubscriptionRepository } from './repositories/admin-subscription.repository';

// Services
import { AdminService } from './service/admin.service';
import { AuditLogService } from './service/audit-log.service';
import { ReportService } from './service/report.service';
import { AdminReportService } from './service/admin-report.service';
import { PlatformSettingService } from './service/platform-setting.service';
import { UserManagementService } from './service/user-management.service';
import { AdminAnalyticsService } from './service/admin-analytics.service';
import { BusinessManagementService } from './service/business-management.service';
import { AdminSubscriptionService } from './service/admin-subscription.service';
import { AdminNotificationService } from './service/admin-notification.service';

// Controllers
import { AdminController } from './controller/admin.controller';
import { AuditLogController } from './controller/audit-log.controller';
import { ReportController } from './controller/report.controller';
import { AdminReportController } from './controller/admin-report.controller';
import { PlatformSettingController } from './controller/platform-setting.controller';
import { UserManagementController } from './controller/user-management.controller';
import { BusinessManagementController } from './controller/business-management.controller';
import { AdminSubscriptionController } from './controller/admin-subscription.controller';
import { AdminNotificationController } from './controller/admin-notification.controller';

export interface Cradle {
  db: typeof db;

  // Repositories
  adminRepository: AdminRepository;
  auditLogRepository: AuditLogRepository;
  reportRepository: ReportRepository;
  adminReportRepository: AdminReportRepository;
  platformSettingRepository: PlatformSettingRepository;
  userManagementRepository: UserManagementRepository;
  businessManagementRepository: BusinessManagementRepository;
  adminSubscriptionRepository: AdminSubscriptionRepository;

  // Services
  adminService: AdminService;
  auditLogService: AuditLogService;
  reportService: ReportService;
  adminReportService: AdminReportService;
  platformSettingService: PlatformSettingService;
  userManagementService: UserManagementService;
  adminAnalyticsService: AdminAnalyticsService;
  businessManagementService: BusinessManagementService;
  adminSubscriptionService: AdminSubscriptionService;
  adminNotificationService: AdminNotificationService;

  // Controllers
  adminController: AdminController;
  auditLogController: AuditLogController;
  reportController: ReportController;
  adminReportController: AdminReportController;
  platformSettingController: PlatformSettingController;
  userManagementController: UserManagementController;
  businessManagementController: BusinessManagementController;
  adminSubscriptionController: AdminSubscriptionController;
  adminNotificationController: AdminNotificationController;
}

export function createAppContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    // Database
    db: asValue(db),

    // Repositories
    adminRepository: asClass(AdminRepository).scoped(),
    auditLogRepository: asClass(AuditLogRepository).scoped(),
    reportRepository: asClass(ReportRepository).scoped(),
    adminReportRepository: asClass(AdminReportRepository).scoped(),
    platformSettingRepository: asClass(PlatformSettingRepository).scoped(),
    userManagementRepository: asClass(UserManagementRepository).scoped(),
    businessManagementRepository: asClass(BusinessManagementRepository).scoped(),
    adminSubscriptionRepository: asClass(AdminSubscriptionRepository).scoped(),

    // Services
    adminService: asClass(AdminService).scoped(),
    auditLogService: asClass(AuditLogService).scoped(),
    reportService: asClass(ReportService).scoped(),
    adminReportService: asClass(AdminReportService).scoped(),
    platformSettingService: asClass(PlatformSettingService).scoped(),
    userManagementService: asClass(UserManagementService).scoped(),
    adminAnalyticsService: asClass(AdminAnalyticsService).scoped(),
    businessManagementService: asClass(BusinessManagementService).scoped(),
    adminSubscriptionService: asClass(AdminSubscriptionService).scoped(),
    adminNotificationService: asClass(AdminNotificationService).scoped(),

    // Controllers
    adminController: asClass(AdminController).scoped(),
    auditLogController: asClass(AuditLogController).scoped(),
    reportController: asClass(ReportController).scoped(),
    adminReportController: asClass(AdminReportController).scoped(),
    platformSettingController: asClass(PlatformSettingController).scoped(),
    userManagementController: asClass(UserManagementController).scoped(),
    businessManagementController: asClass(BusinessManagementController).scoped(),
    adminSubscriptionController: asClass(AdminSubscriptionController).scoped(),
    adminNotificationController: asClass(AdminNotificationController).scoped(),
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
