import { db } from "../config/prisma";
import { Integration, IntegrationProvider, IntegrationStatus } from "@prisma/client";

export class IntegrationRepository {
    static async findByBusinessAndProvider(
        businessId: string,
        provider: IntegrationProvider
    ): Promise<Integration | null> {
        return db.integration.findUnique({
            where: {
                businessId_provider: {
                    businessId,
                    provider,
                },
            },
        });
    }

    static async upsert(
        businessId: string,
        provider: IntegrationProvider,
        data: {
            accessToken: string;
            refreshToken?: string | null;
            tokenExpiry?: Date | null;
            settings?: any;
            status?: IntegrationStatus;
        }
    ): Promise<Integration> {
        return db.integration.upsert({
            where: {
                businessId_provider: {
                    businessId,
                    provider,
                },
            },
            update: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken !== undefined ? data.refreshToken : undefined,
                tokenExpiry: data.tokenExpiry !== undefined ? data.tokenExpiry : undefined,
                settings: data.settings !== undefined ? data.settings : undefined,
                status: data.status ?? "CONNECTED",
            },
            create: {
                businessId,
                provider,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken ?? null,
                tokenExpiry: data.tokenExpiry ?? null,
                settings: data.settings ?? {},
                status: data.status ?? "CONNECTED",
            },
        });
    }

    static async delete(
        businessId: string,
        provider: IntegrationProvider
    ): Promise<Integration> {
        return db.integration.delete({
            where: {
                businessId_provider: {
                    businessId,
                    provider,
                },
            },
        });
    }

    static async updateStatus(id: string, status: IntegrationStatus): Promise<Integration> {
        return db.integration.update({
            where: { id },
            data: { status },
        });
    }

    static async findAllConnectedByProvider(provider: IntegrationProvider): Promise<Integration[]> {
        return db.integration.findMany({
            where: {
                provider,
                status: "CONNECTED",
            },
        });
    }
}
