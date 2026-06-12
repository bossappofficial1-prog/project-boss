import { apiCall, apiClient } from './base';
import type {
    StaffAvailabilityResponse,
    StaffMember,
    CreateStaffPayload,
    UpdateStaffPayload,
} from '@/types/staff';

interface StaffAvailabilityParams {
    slotId?: string | null;
    date?: string;
    startTime?: string;
    endTime?: string;
}

export interface StaffImportRow {
    name: string;
    phone?: string;
    username?: string;
    email?: string;
    pin: string;
    role?: "CASHIER" | "MANAGER" | "WAITER" | "KITCHEN" | "OTHER";
    status?: "ACTIVE" | "INACTIVE";
    privileges?: string[];
}

export interface StaffImportResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string; data: StaffImportRow }>;
    createdStaff: Array<{ id: string; name: string; username: string }>;
}

export const staffApi = {
    async listByOutlet(outletId: string): Promise<StaffMember[]> {
        return apiCall<StaffMember[]>(`/staff/outlet/${outletId}`);
    },

    /**
     * Public endpoint for portal - returns only safe fields
     * No auth required
     */
    async listPublicByOutlet(outletId: string): Promise<StaffMember[]> {
        return apiCall<StaffMember[]>(`/staff/outlet/${outletId}/public`);
    },

    async getById(id: string): Promise<StaffMember> {
        return apiCall<StaffMember>(`/staff/${id}`);
    },

    async create(payload: CreateStaffPayload): Promise<StaffMember> {
        return apiCall<StaffMember>(
            '/staff',
            {
                method: 'POST',
                body: JSON.stringify(payload),
            },
        );
    },

    async update(id: string, payload: UpdateStaffPayload): Promise<StaffMember> {
        return apiCall<StaffMember>(
            `/staff/${id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            },
        );
    },

    async delete(id: string): Promise<{ message: string }> {
        return apiCall<{ message: string }>(
            `/staff/${id}`,
            {
                method: 'DELETE',
            },
        );
    },

    async downloadImportTemplate(): Promise<Blob> {
        const res = await apiClient.get("/staff/import/template", {
            responseType: "blob",
        });
        return res.data;
    },

    async importStaff(outletId: string, rows: StaffImportRow[]): Promise<StaffImportResult> {
        return apiCall<StaffImportResult>(
            "/staff/import",
            {
                method: "POST",
                body: JSON.stringify({ outletId, rows }),
            }
        );
    },

    async getAvailableStaff(productId: string, params: StaffAvailabilityParams): Promise<StaffAvailabilityResponse> {
        const searchParams = new URLSearchParams();

        if (params.slotId) {
            searchParams.append('slotId', params.slotId);
        } else {
            if (!params.date || !params.startTime || !params.endTime) {
                throw new Error('Tanggal, waktu mulai, dan waktu selesai wajib diisi ketika slotId tidak tersedia');
            }

            searchParams.append('date', params.date);
            searchParams.append('startTime', params.startTime);
            searchParams.append('endTime', params.endTime);
        }

        const query = searchParams.toString();
        const path = `/products/${productId}/available-staff${query ? `?${query}` : ''}`;

        return apiCall<StaffAvailabilityResponse>(path);
    },
};