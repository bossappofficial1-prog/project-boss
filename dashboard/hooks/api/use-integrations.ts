import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsApi, type GetIntegrationsResponse } from "@/lib/apis/integrations";

const INTEGRATION_KEYS = {
    all: ["integrations"] as const,
    whatsappStatus: ["whatsapp-status"] as const,
};

export function useIntegrations() {
    return useQuery({
        queryKey: INTEGRATION_KEYS.all,
        queryFn: integrationsApi.getIntegrations,
    });
}

export function useGoogleConnect() {
    return useMutation({
        mutationFn: integrationsApi.getGoogleAuthUrl,
        onSuccess: (data) => {
            if (data?.url && typeof window !== "undefined") {
                window.location.href = data.url;
            }
        },
    });
}

export function useDisconnectGoogle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: integrationsApi.disconnectGoogle,
        onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATION_KEYS.all }),
    });
}

export function useInitiateWhatsApp() {
    return useMutation({
        mutationFn: integrationsApi.initiateWhatsApp,
    });
}

export function useWhatsAppStatus(enabled: boolean) {
    return useQuery({
        queryKey: INTEGRATION_KEYS.whatsappStatus,
        queryFn: integrationsApi.getWhatsAppStatus,
        enabled,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 2000;
            // Stop polling once connected or in disconnected/error final states
            if (data.status === "CONNECTED" || data.status === "ERROR") {
                return false;
            }
            return 2000; // Poll every 2 seconds during initializing/QR_CODE states
        },
    });
}

export function useDisconnectWhatsApp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: integrationsApi.disconnectWhatsApp,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: INTEGRATION_KEYS.all });
            qc.invalidateQueries({ queryKey: INTEGRATION_KEYS.whatsappStatus });
        },
    });
}

export function useSendTestWhatsApp() {
    return useMutation({
        mutationFn: integrationsApi.sendTestWhatsApp,
    });
}
