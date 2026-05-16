import { TransferStatus } from "@prisma/client";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { OutletTransferRepository } from "../repositories/outlet-transfer.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import { UserRepository } from "../repositories/user.repository";
import { getBusinessByOwnerIdService } from "./business.service";
import { SocketEmitter } from "../socket/socket-emiiter";
import { PlanLimitService } from "./plan-limit.service";
import { redis } from "../config/redis";
import { db } from "../config/prisma";

export async function createTransferRequestService(
    outletId: string,
    senderId: string,
    receiverEmail: string,
    note?: string
) {
    // 1. Check outlet and ownership
    const outlet = await OutletRepository.findById(outletId);
    if (!outlet) throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);

    const business = await getBusinessByOwnerIdService(senderId);
    if (outlet.businessId !== business.id) {
        throw new AppError("Anda tidak berhak mentransfer outlet ini.", HttpStatus.FORBIDDEN);
    }

    // 2. Check if already has pending request
    const existingRequest = await OutletTransferRepository.findPendingByOutletId(outletId);
    if (existingRequest) {
        throw new AppError("Sudah ada permintaan transfer pending untuk outlet ini.", HttpStatus.BAD_REQUEST);
    }

    // 3. Find receiver
    const receiver = await UserRepository.findByEmail(receiverEmail);
    if (!receiver) {
        throw new AppError("Penerima tidak ditemukan.", HttpStatus.NOT_FOUND);
    }

    if (receiver.id === senderId) {
        throw new AppError("Anda tidak bisa mentransfer ke diri sendiri.", HttpStatus.BAD_REQUEST);
    }

    if (receiver.business?.subscriptionPlan === "TRIAL") {
        throw new AppError("Transfer akun tidak bisa dilakukan. Upgrade akun tujuan ke paket BASIC atau PRO.", HttpStatus.BAD_REQUEST);
    }

    if (!receiver.business) {
        throw new AppError("Penerima belum memiliki profil bisnis.", HttpStatus.BAD_REQUEST);
    }

    // 4. Create request
    const request = await OutletTransferRepository.create({
        outletId,
        senderId,
        receiverId: receiver.id,
        note
    });

    return request;
}

export async function acceptTransferRequestService(requestId: string, userId: string) {
    const request = await OutletTransferRepository.findById(requestId);
    if (!request) throw new AppError("Permintaan transfer tidak ditemukan.", HttpStatus.NOT_FOUND);

    if (request.receiverId !== userId) {
        throw new AppError("Anda tidak berhak menerima permintaan ini.", HttpStatus.FORBIDDEN);
    }

    if (request.status !== TransferStatus.PENDING) {
        throw new AppError("Permintaan transfer sudah diproses.", HttpStatus.BAD_REQUEST);
    }

    // 1. Get receiver's business
    const receiver = await UserRepository.findById(userId);
    if (!receiver?.business) {
        throw new AppError("Anda belum memiliki profil bisnis.", HttpStatus.BAD_REQUEST);
    }

    // 2. Check quota
    await PlanLimitService.assertCanCreateOutlet(receiver.business.id);

    // 3. Perform transfer
    await db.$transaction([
        db.outlet.update({
            where: { id: request.outletId },
            data: { businessId: receiver.business.id }
        }),
        db.outletTransferRequest.update({
            where: { id: requestId },
            data: { status: TransferStatus.ACCEPTED }
        })
    ]);

    // 4. Invalidate caches
    redis.del(`user:${request.senderId}`);
    redis.del(`user:${request.receiverId}`);
    await PlanLimitService.invalidateUsageCache(receiver.business.id);
    await PlanLimitService.invalidateUsageCache(request.outlet.businessId);

    // 4. Notify sender
    try {
        SocketEmitter.getInstance().emitToCustomer(request.senderId, {
            orderId: request.id,
            amount: 0,
            status: "ACCEPTED",
            isManual: false,
            type: "outlet_transfer_accepted",
            message: `Transfer outlet ${request.outlet.name} telah diterima oleh ${request.receiver.name}`
        });
    } catch (e) {
        console.error("Failed to emit socket event", e);
    }

    return { success: true };
}

export async function rejectTransferRequestService(requestId: string, userId: string) {
    const request = await OutletTransferRepository.findById(requestId);
    if (!request) throw new AppError("Permintaan transfer tidak ditemukan.", HttpStatus.NOT_FOUND);

    if (request.receiverId !== userId) {
        throw new AppError("Anda tidak berhak menolak permintaan ini.", HttpStatus.FORBIDDEN);
    }

    if (request.status !== TransferStatus.PENDING) {
        throw new AppError("Permintaan transfer sudah diproses.", HttpStatus.BAD_REQUEST);
    }

    await OutletTransferRepository.updateStatus(requestId, TransferStatus.REJECTED);

    // Notify sender
    try {
        SocketEmitter.getInstance().emitToCustomer(request.senderId, {
            orderId: request.id,
            amount: 0,
            status: "REJECTED",
            isManual: false,
            type: "outlet_transfer_rejected",
            message: `Permintaan transfer outlet ${request.outlet.name} ditolak oleh ${request.receiver.name}`
        });
    } catch (e) {
        console.error("Failed to emit socket event", e);
    }

    return { success: true };
}

export async function cancelTransferRequestService(requestId: string, userId: string) {
    const request = await OutletTransferRepository.findById(requestId);
    if (!request) throw new AppError("Permintaan transfer tidak ditemukan.", HttpStatus.NOT_FOUND);

    if (request.senderId !== userId) {
        throw new AppError("Anda tidak berhak membatalkan permintaan ini.", HttpStatus.FORBIDDEN);
    }

    if (request.status !== TransferStatus.PENDING) {
        throw new AppError("Permintaan transfer sudah diproses.", HttpStatus.BAD_REQUEST);
    }

    await OutletTransferRepository.updateStatus(requestId, TransferStatus.CANCELLED);

    return { success: true };
}

export async function getIncomingTransfersService(userId: string) {
    return OutletTransferRepository.findIncoming(userId);
}

export async function getOutgoingTransfersService(userId: string) {
    return OutletTransferRepository.findOutgoing(userId);
}
