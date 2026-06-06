import { apiCall } from "./base";

export interface GoogleCalendarIntegration {
    status: "CONNECTED" | "DISCONNECTED" | "ERROR";
    email: string | null;
    connectedAt: string;
}

export interface WhatsAppIntegration {
    status: "CONNECTED" | "DISCONNECTED" | "ERROR";
    phoneNumber: string | null;
    connectedAt: string;
}

export interface GetIntegrationsResponse {
    googleCalendar: GoogleCalendarIntegration | null;
    whatsapp: WhatsAppIntegration | null;
}

export interface WhatsAppStatusResponse {
    status: "DISCONNECTED" | "INITIALIZING" | "QR_CODE" | "CONNECTED" | "ERROR";
    qrCode: string | null;
    phoneNumber: string | null;
}

export const integrationsApi = {
    getIntegrations: () => apiCall<GetIntegrationsResponse>("/integrations"),

    getGoogleAuthUrl: () => apiCall<{ url: string }>("/integrations/google/connect"),

    disconnectGoogle: () => apiCall<any>("/integrations/google", { method: "DELETE" }),

    initiateWhatsApp: () => apiCall<any>("/integrations/whatsapp/initiate", { method: "POST" }),

    getWhatsAppStatus: () => apiCall<WhatsAppStatusResponse>("/integrations/whatsapp/status"),

    disconnectWhatsApp: () => apiCall<any>("/integrations/whatsapp", { method: "DELETE" }),

    sendTestWhatsApp: (data: { phoneNumber: string; message: string }) =>
        apiCall<any>("/integrations/whatsapp/test-send", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};
