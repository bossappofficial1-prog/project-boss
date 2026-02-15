import { $Enums } from "@prisma/client";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import * as ExcelJS from 'exceljs';
import { BusinessRepository } from "../repositories/business.repository";
import { CreateBusinessInput, UpdateBusinessInput } from "../schemas/business.schema";
import { DateUtil } from "../utils";
import { redis } from "../config/redis";

export async function createBusinessService(data: CreateBusinessInput, ownerId: string) {
    const existingBusiness = await BusinessRepository.findByOwnerId(ownerId);
    if (existingBusiness) {
        throw new AppError("Anda sudah memiliki bisnis.", HttpStatus.CONFLICT);
    }
    const business = await BusinessRepository.create(data, ownerId);

    // Invalidate cached user data so /auth/me returns fresh business info
    await redis.del(`user:${ownerId}`);

    return business;
}

export async function getBusinessByOwnerIdService(ownerId: string) {
    const business = await BusinessRepository.findByOwnerId(ownerId);
    if (!business) {
        throw new AppError("Bisnis tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return business;
}

export async function getBusinessByIdService(id: string) {
    const business = await BusinessRepository.findById(id);
    if (!business) {
        throw new AppError("Bisnis tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return business;
}

export async function getAllBusinessesService() {
    const businesses = await BusinessRepository.findAll();
    return businesses;
}

export async function updateBusinessService(id: string, data: UpdateBusinessInput, ownerId: string) {
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== id) {
        throw new AppError("Anda tidak berhak mengubah bisnis ini.", HttpStatus.FORBIDDEN);
    }

    const { defaultTransactionFeeBearer, ...payload } = data
    const updatedBusiness = await BusinessRepository.update(id, payload);

    // Invalidate cached user data so /auth/me returns updated business
    await redis.del(`user:${ownerId}`);

    return updatedBusiness;
}

export async function updateBankAccountService(businessId: string, ownerId: string, data: { bankName: string; bankAccount: string; accountHolder: string; }) {
    const business = await BusinessRepository.findByOwnerId(ownerId);

    if (!business || business.id !== businessId) {
        throw new AppError('You are not authorized to update this business', HttpStatus.FORBIDDEN);
    }

    redis.del(`user:${ownerId}`)
    return BusinessRepository.update(businessId, {
        ...data,
    });
}

export class BusinessAdminService {
    static async findAll(params?: { name?: string, status?: $Enums.SubscriptionStatus }) {
        return BusinessRepository.findAllBusiness(params)
    }

    private static calculateGrowth(current: number, previous: number): KPIGrowth {
        if (!previous || previous === 0) return {
            direction: 'flat',
            label: 'dont have new merchant',
            percentage: 0
        };

        return {
            direction: current > previous ? 'up' : 'down',
            label: 'growth vs last month',
            percentage: ((current - previous) / previous) * 100
        }
    }

    static async getKPIsData(): Promise<{
        totalMerchants: KPIItem,
        subscriptionRevenue: KPIItem,
        platformHealth: KPIItem,
    }> {
        const { totalLastMonth, totalMerchantSuspend, totalMerchantThisMonth, totalMerchants, totalIncommingMerchantExpire } = await BusinessRepository.getKPIs();

        return {
            totalMerchants: {
                value: totalMerchants,
                unit: "count",
                growth: this.calculateGrowth(totalMerchantThisMonth, totalLastMonth)
            },
            platformHealth: {
                value: ((totalMerchants - totalMerchantSuspend) / totalMerchants) * 100,
                unit: 'percent',
                meta: {
                    suspendedAccounts: totalMerchantSuspend
                }
            },
            subscriptionRevenue: {
                value: 123_456_789,
                unit: 'currency',
                meta: {
                    expiringSoon: totalIncommingMerchantExpire
                }
            }
        }
    }

    static async exportTenantData() {
        const businesses = await BusinessRepository.findAllBusiness();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'POS Platform Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Daftar Tenant');
        sheet.columns = [
            { header: 'BUSINESS NAME', key: 'businessName', width: 30 },
            { header: 'OWNER NAME', key: 'ownerName', width: 25 },
            { header: 'OWNER EMAIL', key: 'ownerEmail', width: 30 },
            { header: 'SUBSCRIPTION PLAN', key: 'plan', width: 20 },
            { header: 'SUBSCRIPTION EXPIRY', key: 'expiry', width: 25 },
            { header: 'STATUS', key: 'status', width: 15 },
            { header: 'JOINED DATE', key: 'joinedDate', width: 20 },
        ]

        businesses.forEach((b) => {
            sheet.addRow({
                businessName: b.name,
                ownerName: b.owner.name,
                ownerEmail: b.owner.email,
                plan: b.subscriptionPlan,
                expiry: b.subscriptionEndDate
                    ? DateUtil.formatDate(b.subscriptionEndDate)
                    : 'Lifetime',
                status: b.subscriptionStatus,
                joinedDate: DateUtil.formatDate(b.createdAt)
            })
        })

        sheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF444444' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        return workbook;
    }
}

export type KPIStatus = "healthy" | "warning" | "critical"
export interface KPIGrowth {
    percentage: number | null
    direction: "up" | "down" | "flat" | "new"
    label: string
}
export interface KPIPeriod {
    type: "daily" | "weekly" | "monthly" | "yearly"
    current: string
    compareWith?: string
}


export interface KPIItem {
    value: number
    formatted?: string
    unit?: "count" | "currency" | "percent"
    status?: KPIStatus
    growth?: KPIGrowth | null
    meta?: Record<string, number | string | boolean>
}