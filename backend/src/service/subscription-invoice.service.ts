import { PaymentStatus } from "@prisma/client";
import { SubscriptionInvoiceRepository, type SubscriptionInvoiceListOptions } from "../repositories/subscription-invoice.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { ImageService } from "./image.service";

const VERIFIABLE_STATUSES: PaymentStatus[] = [PaymentStatus.PROOF_SUBMITTED, PaymentStatus.AWAITING_VERIFICATION];

export class SubscriptionInvoiceService {
    static async listInvoices(options: SubscriptionInvoiceListOptions) {
        return SubscriptionInvoiceRepository.listInvoices(options);
    }

    static async verifyInvoice(invoiceId: string) {
        const invoice = await SubscriptionInvoiceRepository.findById(invoiceId);

        if (!invoice) {
            throw new AppError("Subscription invoice tidak ditemukan", HttpStatus.NOT_FOUND);
        }

        if (!invoice.proofImage) {
            throw new AppError("Bukti pembayaran belum diunggah", HttpStatus.BAD_REQUEST);
        }

        if (!VERIFIABLE_STATUSES.includes(invoice.status)) {
            throw new AppError("Invoice belum siap diverifikasi", HttpStatus.BAD_REQUEST);
        }

        const updated = await SubscriptionInvoiceRepository.verifyInvoice(invoiceId);

        if (!updated) {
            throw new AppError("Gagal memperbarui invoice", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return updated;
    }

    static async rejectInvoice(invoiceId: string, reason: string) {
        const invoice = await SubscriptionInvoiceRepository.findById(invoiceId);

        if (!invoice) {
            throw new AppError("Subscription invoice tidak ditemukan", HttpStatus.NOT_FOUND);
        }

        if (!invoice.proofImage) {
            throw new AppError("Belum ada bukti pembayaran untuk ditolak", HttpStatus.BAD_REQUEST);
        }

        if (!VERIFIABLE_STATUSES.includes(invoice.status)) {
            throw new AppError("Invoice belum siap ditolak", HttpStatus.BAD_REQUEST);
        }

        // Hapus file bukti lama jika tersedia; abaikan kegagalan delete agar penolakan tetap berlangsung.
        try {
            if (invoice.proofImage) {
                ImageService.deleteImageByUrl(invoice.proofImage);
            }
        } catch (err) {
            // Log dan lanjut; tidak memblokir penolakan.
            console.error("Failed to delete proof image on reject", err);
        }

        const updated = await SubscriptionInvoiceRepository.rejectInvoice(invoiceId, reason);

        if (!updated) {
            throw new AppError("Gagal memperbarui invoice", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return updated;
    }
}
