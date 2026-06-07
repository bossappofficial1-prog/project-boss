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
  clockInFaceUrl: string | null;
  clockOutFaceUrl: string | null;
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
    clockInFaceUrl?: string;
  }) {
    const res = await apiClient.post("/attendance/clock-in", data);
    return res.data.data;
  },

  async clockOut(
    id: string,
    data?: { latitude?: number; longitude?: number; notes?: string; clockOutFaceUrl?: string },
  ) {
    const res = await apiClient.post(`/attendance/${id}/clock-out`, data ?? {});
    return res.data.data;
  },

  async getMyAttendance(page = 1, limit = 20) {
    const res = await apiClient.get("/attendance/me", {
      params: { page, limit },
    });
    return (res.data?.data as PaginatedAttendance) ?? { data: [], total: 0 };
  },

  async getToday() {
    const res = await apiClient.get("/attendance/today");
    return (res.data?.data as AttendanceRecord | undefined) ?? null;
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
    return (res.data?.data as PaginatedAttendance) ?? { data: [], total: 0 };
  },

  async createManual(data: {
    outletId: string;
    staffId: string;
    date: string;
    clockIn: string;
    clockOut?: string | null;
    notes?: string;
  }) {
    const res = await apiClient.post("/attendance/manage", data);
    return res.data.data;
  },

  async updateManual(id: string, data: {
    clockIn?: string;
    clockOut?: string | null;
    notes?: string;
  }) {
    const res = await apiClient.put(`/attendance/manage/${id}`, data);
    return res.data.data;
  },

  async deleteManual(id: string) {
    const res = await apiClient.delete(`/attendance/manage/${id}`);
    return res.data.data;
  },

  async portalClock(data: {
    staffId: string;
    pin: string;
    outletId: string;
    type: "in" | "out";
    latitude?: number;
    longitude?: number;
    notes?: string;
    faceImageUrl?: string;
    registerFaceDescriptor?: string;
  }) {
    const res = await apiClient.post("/attendance/portal/clock", data);
    return res.data.data;
  },

  async exportAttendance(params: {
    outletId: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const res = await apiClient.get("/attendance/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },
};
