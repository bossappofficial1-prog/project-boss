import { apiClient } from "./base";

export interface AttendanceRecord {
  id: string;
  staffId: string;
  outletId: string;
  clockIn: string;
  clockOut: string | null;
  date: string;
  notes: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  createdAt: string;
  updatedAt: string;
  staff?: { id: string; name: string; username: string | null };
}

export interface PaginatedAttendance {
  data: AttendanceRecord[];
  total: number;
}

export const attendanceApi = {
  async clockIn(data: {
    outletId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    const res = await apiClient.post("/attendance/clock-in", data);
    return res.data.data;
  },

  async clockOut(
    id: string,
    data?: { latitude?: number; longitude?: number; notes?: string },
  ) {
    const res = await apiClient.post(`/attendance/${id}/clock-out`, data ?? {});
    return res.data.data;
  },

  async getMyAttendance(page = 1, limit = 20) {
    const res = await apiClient.get("/attendance/me", {
      params: { page, limit },
    });
    return res.data.data as PaginatedAttendance;
  },

  async getToday() {
    const res = await apiClient.get("/attendance/today");
    return res.data.data as AttendanceRecord | null;
  },

  async listForOwner(params: {
    outletId: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await apiClient.get("/attendance", { params });
    return res.data.data as PaginatedAttendance;
  },
};
