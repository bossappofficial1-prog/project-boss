import { TransferStatus } from "@prisma/client";
import { db } from "../config/prisma";

export class OutletTransferRepository {
    static async create(data: {
        outletId: string;
        senderId: string;
        receiverId: string;
        note?: string;
    }) {
        return db.outletTransferRequest.create({
            data: {
                ...data,
                status: TransferStatus.PENDING,
            },
            include: {
                outlet: true,
                sender: {
                    select: { id: true, name: true, email: true }
                },
                receiver: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }

    static async findById(id: string) {
        return db.outletTransferRequest.findUnique({
            where: { id },
            include: {
                outlet: true,
                sender: {
                    select: { id: true, name: true, email: true }
                },
                receiver: {
                    select: { id: true, name: true, email: true, business: true }
                }
            }
        });
    }

    static async findPendingByOutletId(outletId: string) {
        return db.outletTransferRequest.findFirst({
            where: {
                outletId,
                status: TransferStatus.PENDING
            }
        });
    }

    static async findIncoming(userId: string) {
        return db.outletTransferRequest.findMany({
            where: {
                receiverId: userId,
                status: TransferStatus.PENDING
            },
            include: {
                outlet: true,
                sender: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async findOutgoing(userId: string) {
        return db.outletTransferRequest.findMany({
            where: {
                senderId: userId
            },
            include: {
                outlet: true,
                receiver: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async updateStatus(id: string, status: TransferStatus) {
        return db.outletTransferRequest.update({
            where: { id },
            data: { status }
        });
    }

    static async deleteByOutletId(outletId: string) {
        return db.outletTransferRequest.deleteMany({
            where: { outletId }
        });
    }
}
