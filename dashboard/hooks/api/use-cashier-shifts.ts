"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeCashierShift,
  getActiveCashierShift,
  openCashierShift,
} from "@/lib/apis/cashier-shifts";

export function useActiveCashierShift(outletId?: string) {
  return useQuery({
    queryKey: ["cashier-shift-active", outletId],
    queryFn: () => getActiveCashierShift(outletId!),
    enabled: !!outletId,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useOpenCashierShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: openCashierShift,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["cashier-shift-active", vars.outletId] });
    },
  });
}

export function useCloseCashierShift(outletId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shiftId,
      closingCash,
      notes,
    }: {
      shiftId: string;
      closingCash: number;
      notes?: string;
    }) => closeCashierShift(shiftId, { closingCash, notes }),
    onSuccess: () => {
      if (outletId) qc.invalidateQueries({ queryKey: ["cashier-shift-active", outletId] });
    },
  });
}
