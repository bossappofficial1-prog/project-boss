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
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/calendar.readonly",
                "email",
            ],
            state: businessId
        });
        return url;
    }

    static async handleGoogleCallback(code: string, businessId: string): Promise<Integration> {
        try {
            const oauth2Client = this.getOAuth2Client();
            const redirectUri = config.google.calendarRedirectUrl;

            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code,
                    client_id: config.google.clientId,
                    client_secret: config.google.clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: "authorization_code",
                }),
            });

            const tokenData = await tokenResponse.json() as {
                access_token?: string;
                refresh_token?: string;
                expires_in?: number;
                error?: string;
                error_description?: string;
            };

            if (!tokenResponse.ok) {
                this.badRequest(`Gagal mendapatkan token: ${tokenData.error} - ${tokenData.error_description}`);
            }

            if (!tokenData.access_token) {
                this.badRequest("Gagal mendapatkan access token dari Google");
            }

            const expiryDate = tokenData.expires_in
                ? new Date(Date.now() + tokenData.expires_in * 1000)
                : null;

            oauth2Client.setCredentials({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expiry_date: expiryDate?.getTime(),
            });

            const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get().catch(() => null);
            const email = userInfo?.data?.email || "Unknown Google Account";

            return await IntegrationRepository.upsert(businessId, "GOOGLE_CALENDAR", {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiry: expiryDate,
                settings: { email, calendarId: "primary" },
            });
        } catch (error: any) {
            this.badRequest("Gagal menyambungkan ke Google Calendar");
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

        const sessionsDir = path.join(process.cwd(), "sessions");
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
                        this.initiateWhatsApp(businessId).catch(() => { });
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

                        await IntegrationRepository.delete(businessId, "WHATSAPP").catch(() => { });
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
            } catch (e) { }
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

    // ── Google Calendar ──────────────────────────────────────────────

    static async createCalendarEvent(businessId: string, params: {
        summary: string;
        description: string;
        startTime: Date;
        endTime: Date;
    }): Promise<string | null> {
        try {
            const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "GOOGLE_CALENDAR");
            if (!integration || integration.status !== "CONNECTED") {
                console.log(`[GoogleCalendar] Skipping: business ${businessId} has no active Google Calendar connection`);
                return null;
            }

            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
                expiry_date: integration.tokenExpiry?.getTime(),
            });

            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            const response = await calendar.events.insert({
                calendarId: (integration.settings as any)?.calendarId || "primary",
                requestBody: {
                    summary: params.summary,
                    description: params.description,
                    start: { dateTime: params.startTime.toISOString(), timeZone: "Asia/Jakarta" },
                    end: { dateTime: params.endTime.toISOString(), timeZone: "Asia/Jakarta" },
                },
            });

            const eventId = response.data.id;
            console.log(`[GoogleCalendar] Event created: ${eventId} for business ${businessId}`);
            return eventId || null;
        } catch (error: any) {
            console.error(`[GoogleCalendar] Failed to create event for business ${businessId}:`, error.message);
            return null;
        }
    }

    static async updateCalendarEvent(businessId: string, eventId: string, params: {
        summary: string;
        description: string;
        startTime: Date;
        endTime: Date;
    }): Promise<boolean> {
        try {
            const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "GOOGLE_CALENDAR");
            if (!integration || integration.status !== "CONNECTED") {
                console.log(`[GoogleCalendar] Skipping update: business ${businessId} has no active Google Calendar connection`);
                return false;
            }

            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
                expiry_date: integration.tokenExpiry?.getTime(),
            });

            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            await calendar.events.update({
                calendarId: (integration.settings as any)?.calendarId || "primary",
                eventId,
                requestBody: {
                    summary: params.summary,
                    description: params.description,
                    start: { dateTime: params.startTime.toISOString(), timeZone: "Asia/Jakarta" },
                    end: { dateTime: params.endTime.toISOString(), timeZone: "Asia/Jakarta" },
                },
            });

            console.log(`[GoogleCalendar] Event updated: ${eventId} for business ${businessId}`);
            return true;
        } catch (error: any) {
            console.error(`[GoogleCalendar] Failed to update event ${eventId} for business ${businessId}:`, error.message);
            return false;
        }
    }

    static async deleteCalendarEvent(businessId: string, eventId: string): Promise<boolean> {
        try {
            const integration = await IntegrationRepository.findByBusinessAndProvider(businessId, "GOOGLE_CALENDAR");
            if (!integration || integration.status !== "CONNECTED") {
                console.log(`[GoogleCalendar] Skipping delete: business ${businessId} has no active Google Calendar connection`);
                return false;
            }

            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
                expiry_date: integration.tokenExpiry?.getTime(),
            });

            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            await calendar.events.delete({
                calendarId: (integration.settings as any)?.calendarId || "primary",
                eventId,
            });

            console.log(`[GoogleCalendar] Event deleted: ${eventId} for business ${businessId}`);
            return true;
        } catch (error: any) {
            console.error(`[GoogleCalendar] Failed to delete event ${eventId} for business ${businessId}:`, error.message);
            return false;
        }
    }
}
