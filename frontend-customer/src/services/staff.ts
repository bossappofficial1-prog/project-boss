import api from "@/lib/api";
import { StaffAvailabilityResponse } from "@/types/staff";

type StaffQueryParams = {
    slotId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
};

export class StaffService {
    static async getAvailableStaff(productId: string, params: StaffQueryParams): Promise<StaffAvailabilityResponse> {
        const searchParams = new URLSearchParams();

        if (params.slotId) {
            searchParams.append("slotId", params.slotId);
        } else {
            if (params.date) searchParams.append("date", params.date);
            if (params.startTime) searchParams.append("startTime", params.startTime);
            if (params.endTime) searchParams.append("endTime", params.endTime);
        }

        const queryString = searchParams.toString();
        const endpoint = `/products/${productId}/available-staff${queryString ? `?${queryString}` : ""}`;

        const response = await api.get(endpoint);
        return response.data.data as StaffAvailabilityResponse;
    }
}
