import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { IntegrationService } from "../service/integration.service";
import { IntegrationProvider } from "@prisma/client";
import { HttpStatus } from "../constants/http-status";

class IntegrationController extends BaseController {
    getIntegrations = this.handler(async (req: Request, res: Response) => {
        const businessId = req.storedUser?.businessId;
        if (!businessId) {
            return this.error(res, "Bisnis tidak terasosiasi dengan akun Anda", undefined, HttpStatus.FORBIDDEN);
        }

        const data = await IntegrationService.getIntegrations(businessId);
        return this.success(res, data, HttpStatus.OK);
    });

    getGoogleAuthUrl = this.handler(async (req: Request, res: Response) => {
        const businessId = req.storedUser?.businessId;
        if (!businessId) {
            return this.error(res, "Bisnis tidak terasosiasi dengan akun Anda", undefined, HttpStatus.FORBIDDEN);
        }

        const url = await IntegrationService.getGoogleAuthUrl(businessId);
        return this.success(res, { url }, HttpStatus.OK);
    });

    googleCallback = this.handler(async (req: Request, res: Response) => {
        const { code, state: businessId } = req.query;

        if (!code || !businessId) {
            return this.error(res, "Parameter code dan state (businessId) diperlukan", undefined, HttpStatus.BAD_REQUEST);
        }

        await IntegrationService.handleGoogleCallback(code as string, businessId as string);

        // Redirect back to dashboard integrations page
        const clientUrls = (process.env.CLIENT_URL || "http://localhost:3010").split(",").map(s => s.trim());
        const clientUrl = clientUrls[0];
        return res.redirect(`${clientUrl}/owner/settings?integration=google_success`);
    });

    initiateWhatsApp = this.handler(async (req: Request, res: Response) => {
        const businessId = req.storedUser?.businessId;
        if (!businessId) {
            return this.error(res, "Bisnis tidak terasosiasi dengan akun Anda", undefined, HttpStatus.FORBIDDEN);
        }

        await IntegrationService.initiateWhatsApp(businessId);
        return this.success(res, null, HttpStatus.OK, "Proses inisialisasi WhatsApp dimulai");
    });

    getWhatsAppStatus = this.handler(async (req: Request, res: Response) => {
        const businessId = req.storedUser?.businessId;
        if (!businessId) {
            return this.error(res, "Bisnis tidak terasosiasi dengan akun Anda", undefined, HttpStatus.FORBIDDEN);
        }

        const status = await IntegrationService.getWhatsAppStatus(businessId);
        return this.success(res, status, HttpStatus.OK);
    });

    disconnect = this.handler(async (req: Request, res: Response) => {
        const businessId = req.storedUser?.businessId;
        if (!businessId) {
            return this.error(res, "Bisnis tidak terasosiasi dengan akun Anda", undefined, HttpStatus.FORBIDDEN);
        }

        const provider = req.params.provider as IntegrationProvider;
        if (!Object.values(IntegrationProvider).includes(provider)) {
            return this.error(res, "Provider tidak valid", undefined, HttpStatus.BAD_REQUEST);
        }

        await IntegrationService.disconnect(businessId, provider);
        return this.success(res, null, HttpStatus.OK, `${provider} berhasil diputus`);
    });

    sendTestWhatsApp = this.handler(async (req: Request, res: Response) => {
        const businessId = req.storedUser?.businessId;
        if (!businessId) {
            return this.error(res, "Bisnis tidak terasosiasi dengan akun Anda", undefined, HttpStatus.FORBIDDEN);
        }

        const { phoneNumber, message } = req.body;
        if (!phoneNumber || !message) {
            return this.error(res, "Nomor telepon dan pesan wajib diisi", undefined, HttpStatus.BAD_REQUEST);
        }

        const success = await IntegrationService.sendWhatsAppMessage(businessId, phoneNumber, message);
        if (success) {
            return this.success(res, null, HttpStatus.OK, "Pesan uji coba berhasil dikirim");
        } else {
            return this.error(res, "Gagal mengirim pesan uji coba. Pastikan koneksi Anda aktif.", undefined, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    });
}

export const integrationController = new IntegrationController();
