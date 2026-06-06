import { BaseService } from "./base.service";
import { IntegrationRepository } from "../repositories/integration.repository";
import { Integration, IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { google } from "googleapis";
import { config } from "../config";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";

export class IntegrationService extends BaseService {
    private static activeSockets = new Map<string, any>();
    private static waSessions = new Map<string, {
        status: "DISCONNECTED" | "INITIALIZING" | "QR_CODE" | "CONNECTED" | "ERROR";
        qrCode: string | null;
        phoneNumber: string | null;
        createdAt: Date;
    }>();

    private static getOAuth2Client() {
        return new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.calendarRedirectUrl
        );
    }

    static async getGoogleAuthUrl(businessId: string): Promise<string> {
        const oauth2Client = this.getOAuth2Client();
        return oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/calendar.readonly"
            ],
            state: businessId
        });
    }

    static async handleGoogleCallback(code: string, businessId: string): Promise<Integration> {
        try {
            const oauth2Client = this.getOAuth2Client();
            const { tokens } = await oauth2Client.getToken(code);

            if (!tokens.access_token) {
                this.badRequest("Gagal mendapatkan access token dari Google");
            }

            const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

            // Fetch owner profile to store in settings (e.g. Google email)
            oauth2Client.setCredentials(tokens);
            const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get().catch(() => null);
            const email = userInfo?.data?.email || "Unknown Google Account";

            return await IntegrationRepository.upsert(businessId, "GOOGLE_CALENDAR", {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token, // Only sent on first consent
                tokenExpiry: expiryDate,
                settings: {
                    email,
                    calendarId: "primary"
                }
            });
        } catch (error: any) {
            this.badRequest(`Gagal menyambungkan ke Google Calendar: ${error.message}`);
        }
    }

    static async initiateWhatsApp(businessId: string): Promise<void> {
        // Hentikan socket aktif jika sudah ada sebelumnya
        await this.cleanupWhatsAppSocket(businessId);

        this.waSessions.set(businessId, {
            status: "INITIALIZING",
            qrCode: null,
            phoneNumber: null,
            createdAt: new Date()
        });

        const sessionsDir = path.join(__dirname, "../../sessions");
        const sessionPath = path.join(sessionsDir, businessId);

        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
        }

        try {
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            const socket = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }) as any,
            });

            this.activeSockets.set(businessId, socket);

            socket.ev.on("creds.update", saveCreds);

            socket.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.waStatusSet(businessId, "QR_CODE", qr);
                }

                if (connection === "connecting") {
                    const current = this.waSessions.get(businessId);
                    if (!current || current.status !== "QR_CODE") {
                        this.waStatusSet(businessId, "INITIALIZING");
                    }
                }

                if (connection === "open") {
                    const phone = socket.user?.id.split(":")[0] || "Unknown";
                    this.waSessions.set(businessId, {
                        status: "CONNECTED",
                        qrCode: null,
                        phoneNumber: phone,
                        createdAt: new Date()
                    });

                    // Simpan status koneksi ke DB
                    await IntegrationRepository.upsert(businessId, "WHATSAPP", {
                        accessToken: "baileys-active-session",
                        status: "CONNECTED",
                        settings: {
                            phone,
                            provider: "BAILEYS_SOCKET"
                        }
                    }).catch(err => {
                        console.error("Gagal menyimpan integrasi WhatsApp ke DB:", err);
                    });
                }

                if (connection === "close") {
                    const errorStatus = (lastDisconnect?.error as Boom)?.output?.statusCode;
                    const shouldReconnect = errorStatus !== DisconnectReason.loggedOut;

                    console.log(`[WhatsApp] Koneksi terputus untuk bisnis ${businessId}. Reconnecting: ${shouldReconnect}, Status Code: ${errorStatus}`);

                    if (shouldReconnect) {
                        // Coba sambungkan ulang secara rekursif
                        this.initiateWhatsApp(businessId).catch(() => {});
                    } else {
                        // Jika sengaja logout dari HP: hapus file sesi dan database
                        this.waSessions.set(businessId, {
                            status: "DISCONNECTED",
                            qrCode: null,
                            phoneNumber: null,
                            createdAt: new Date()
                        });
                        this.activeSockets.delete(businessId);

                        try {
                            fs.rmSync(sessionPath, { recursive: true, force: true });
                        } catch (e) {
                            console.error("Gagal menghapus folder sesi:", e);
                        }

                        await IntegrationRepository.delete(businessId, "WHATSAPP").catch(() => {});
                    }
                }
            });
        } catch (error: any) {
            console.error("Gagal inisialisasi Baileys:", error);
            this.waSessions.set(businessId, {
                status: "ERROR",
                qrCode: null,
                phoneNumber: null,
                createdAt: new Date()
            });
        }
    }

    private static waStatusSet(
        businessId: string,
        status: "DISCONNECTED" | "INITIALIZING" | "QR_CODE" | "CONNECTED" | "ERROR",
        qr: string | null = null
    ) {
        const session = this.waSessions.get(businessId);
        this.waSessions.set(businessId, {
            status,
            qrCode: qr,
            phoneNumber: session?.phoneNumber || null,
            createdAt: session?.createdAt || new Date()
        });
    }

    static async getWhatsAppStatus(businessId: string) {
        // Cek database terlebih dahulu
        const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "WHATSAPP");
        if (integration && integration.status === "CONNECTED") {
            const phone = (integration.settings as any)?.phone || null;
            return {
                status: "CONNECTED",
                qrCode: null,
                phoneNumber: phone
            };
        }

        const session = this.waSessions.get(businessId);
        if (!session) {
            return {
                status: "DISCONNECTED",
                qrCode: null,
                phoneNumber: null
            };
        }

        return {
            status: session.status,
            qrCode: session.qrCode,
            phoneNumber: session.phoneNumber
        };
    }

    static async getIntegrations(businessId: string) {
        const googleCal = await IntegrationRepository.findByBusinessAndProvider(businessId, "GOOGLE_CALENDAR");
        const whatsapp = await IntegrationRepository.findByBusinessAndProvider(businessId, "WHATSAPP");

        return {
            googleCalendar: googleCal
                ? {
                      status: googleCal.status,
                      email: (googleCal.settings as any)?.email || null,
                      connectedAt: googleCal.createdAt
                  }
                : null,
            whatsapp: whatsapp
                ? {
                      status: whatsapp.status,
                      phoneNumber: (whatsapp.settings as any)?.phone || null,
                      connectedAt: whatsapp.createdAt
                  }
                : null
        };
    }

    static async disconnect(businessId: string, provider: IntegrationProvider): Promise<void> {
        const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, provider);
        if (!integration) {
            this.notFound("Integrasi tidak ditemukan");
        }
        await IntegrationRepository.delete(businessId, provider);

        if (provider === "WHATSAPP") {
            await this.cleanupWhatsAppSocket(businessId);
            this.waSessions.delete(businessId);

            const sessionPath = path.join(__dirname, "../../sessions", businessId);
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            } catch (e) {
                console.error("Gagal menghapus folder sesi saat putuskan integrasi:", e);
            }
        }
    }

    private static async cleanupWhatsAppSocket(businessId: string): Promise<void> {
        const socket = this.activeSockets.get(businessId);
        if (socket) {
            try {
                socket.end(undefined);
            } catch (e) {}
            this.activeSockets.delete(businessId);
        }
    }

    // Auto-reconnect seluruh sesi WhatsApp yang tersambung saat server restart
    static async initializeAllSessions(): Promise<void> {
        try {
            const connectedIntegrations = await IntegrationRepository.findAllConnectedByProvider("WHATSAPP");
            console.log(`[WhatsApp] Menghubungkan ulang ${connectedIntegrations.length} sesi WhatsApp...`);
            
            for (const integration of connectedIntegrations) {
                this.initiateWhatsApp(integration.businessId).catch((err) => {
                    console.error(`Gagal menghubungkan ulang WhatsApp untuk bisnis ${integration.businessId}:`, err);
                });
            }
        } catch (error) {
            console.error("Gagal menginisialisasi sesi WhatsApp terhubung:", error);
        }
    }

    // Mengirim pesan WhatsApp menggunakan socket aktif bisnis terkait
    static async sendWhatsAppMessage(businessId: string, to: string, text: string): Promise<boolean> {
        let socket = this.activeSockets.get(businessId);

        if (!socket) {
            const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "WHATSAPP");
            if (integration && integration.status === "CONNECTED") {
                await this.initiateWhatsApp(businessId);
                // Tunggu 3 detik untuk inisialisasi koneksi
                await new Promise((resolve) => setTimeout(resolve, 3000));
                socket = this.activeSockets.get(businessId);
            }
        }

        if (!socket) {
            console.error(`[WhatsApp] Gagal mengirim pesan ke ${to}: Sesi socket untuk bisnis ${businessId} tidak aktif`);
            return false;
        }

        try {
            let formattedPhone = to.replace(/[^0-9]/g, "");
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "62" + formattedPhone.substring(1);
            }
            const jid = `${formattedPhone}@s.whatsapp.net`;

            await socket.sendMessage(jid, { text });
            console.log(`[WhatsApp] Pesan berhasil dikirim ke ${jid} dari bisnis ${businessId}`);
            return true;
        } catch (error) {
            console.error(`[WhatsApp] Gagal mengirim pesan ke ${to} untuk bisnis ${businessId}:`, error);
            return false;
        }
    }

    // Mengirim dokumen WhatsApp menggunakan socket aktif bisnis terkait
    static async sendWhatsAppDocument(businessId: string, to: string, file: Buffer, fileName: string, mimetype: string, caption?: string): Promise<boolean> {
        let socket = this.activeSockets.get(businessId);

        if (!socket) {
            const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "WHATSAPP");
            if (integration && integration.status === "CONNECTED") {
                await this.initiateWhatsApp(businessId);
                // Tunggu 3 detik untuk inisialisasi koneksi
                await new Promise((resolve) => setTimeout(resolve, 3000));
                socket = this.activeSockets.get(businessId);
            }
        }

        if (!socket) {
            console.error(`[WhatsApp] Gagal mengirim dokumen ke ${to}: Sesi socket untuk bisnis ${businessId} tidak aktif`);
            return false;
        }

        try {
            let formattedPhone = to.replace(/[^0-9]/g, "");
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "62" + formattedPhone.substring(1);
            }
            const jid = `${formattedPhone}@s.whatsapp.net`;

            await socket.sendMessage(jid, {
                document: file,
                fileName,
                mimetype,
                caption
            });
            console.log(`[WhatsApp] Dokumen ${fileName} berhasil dikirim ke ${jid} dari bisnis ${businessId}`);
            return true;
        } catch (error) {
            console.error(`[WhatsApp] Gagal mengirim dokumen ke ${to} untuk bisnis ${businessId}:`, error);
            return false;
        }
    }
}
