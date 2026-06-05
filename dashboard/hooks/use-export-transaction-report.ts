import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/lib/apis/base";
import { toast } from "sonner";

// Request payload
export interface ExportTransactionReportRequest {
    startDate: string;
    endDate: string;
}

// API function
const exportTransactionReport = async (
    payload: ExportTransactionReportRequest
): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post("/reports/export-transaction", payload);
    return data;
};

// Hook
export const useExportTransactionReport = () => {
    return useMutation({
        mutationFn: exportTransactionReport,
        onSuccess: (data) => {
            toast.success(data.message || "E-statement sedang diproses. Akan dikirim ke email Anda.");
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message || "Gagal memproses permintaan e-statement";
            toast.error(message);
        },
    });
};
