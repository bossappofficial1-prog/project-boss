import { Business } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateBusinessInput, UpdateBusinessInput } from "../schemas/business.schema";

export class BusinessRepository {
    static async create(data: CreateBusinessInput, ownerId: string): Promise<Business> {
        return db.business.create({
            data: {
                ...data,
                ownerId,
                wallet: {
                    create: { balance: 0 }
                }
            },
        });
    }

    static async findByOwnerId(ownerId: string): Promise<Business | null> {
        return db.business.findUnique({
            where: { ownerId },
        });
    }

    static async findById(id: string): Promise<Business | null> {
        return db.business.findUnique({
            where: { id },
        });
    }

    static async findAll(): Promise<Business[]> {
        return db.business.findMany();
    }

    static async update(id: string, data: UpdateBusinessInput): Promise<Business> {
        return db.business.update({
            where: { id },
            data,
        });
    }
}