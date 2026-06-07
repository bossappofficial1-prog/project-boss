import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/apis/attendance";

export const KEYS = {
  today: (staffId?: string) => ["attendance", "today", staffId],
  me: (staffId: string, page: number) => ["attendance", "me", staffId, page],
  owner: (params: Record<string, any>) => ["attendance", "owner", params],
};

export function useTodayAttendance(staffId?: string) {
  return useQuery({
    queryKey: KEYS.today(staffId),
    queryFn: () => attendanceApi.getToday(),
    enabled: !!staffId,
    refetchInterval: 30_000,
  });
}

export function useMyAttendance(staffId: string, page = 1) {
  return useQuery({
    queryKey: KEYS.me(staffId, page),
    queryFn: () => attendanceApi.getMyAttendance(page),
    enabled: !!staffId,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { outletId: string; latitude?: number; longitude?: number; notes?: string; clockInFaceUrl?: string }) =>
      attendanceApi.clockIn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; latitude?: number; longitude?: number; notes?: string; clockOutFaceUrl?: string }) =>
      attendanceApi.clockOut(params.id, { latitude: params.latitude, longitude: params.longitude, notes: params.notes, clockOutFaceUrl: params.clockOutFaceUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useOwnerAttendance(params: {
  outletId: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: KEYS.owner(params),
    queryFn: () => attendanceApi.listForOwner(params),
    enabled: !!params.outletId,
  });
}

export function useCreateManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      outletId: string;
      staffId: string;
      date: string;
      clockIn: string;
      clockOut?: string | null;
      notes?: string;
    }) => attendanceApi.createManual(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useUpdateManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      data: {
        clockIn?: string;
        clockOut?: string | null;
        notes?: string;
      };
    }) => attendanceApi.updateManual(params.id, params.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useDeleteManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.deleteManual(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
