import { apiClient } from "./base";

export type ShiftStatus = "OPEN" | "CLOSED";

export interface CashMovement {
  id: string;
  type: string;
  amount: number;
  note?: string | null;
  createdAt: string;
}

export interface CashierShift {
  id: string;
  status: ShiftStatus;
  outletId: string;
  staffId: string;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  closingCash?: number | null;
  notes?: string | null;
  cashMovements?: CashMovement[];
}

export interface OwnerShiftRow extends CashierShift {
  staff?: { id: string; name: string; username?: string | null };
  totals?: {
    transactionCount: number;
    salesTotal: number;
    cashSalesTotal: number;
    qrisSalesTotal: number;
    cashMovementNet: number;
  };
}

export async function getActiveCashierShift(outletId: string): Promise<CashierShift | null> {
  const res = await apiClient.get(`/cashier-shifts/active`, { params: { outletId } });
  return (res.data.data as CashierShift) ?? null;
}

export async function openCashierShift(payload: {
  outletId: string;
  openingCash: number;
  notes?: string;
}): Promise<CashierShift> {
  const res = await apiClient.post(`/cashier-shifts/open`, payload);
  return res.data.data as CashierShift;
}

export async function closeCashierShift(
  shiftId: string,
  payload: { closingCash: number; notes?: string },
): Promise<CashierShift> {
  const res = await apiClient.post(`/cashier-shifts/${shiftId}/close`, payload);
  return res.data.data as CashierShift;
}

export async function listOwnerCashierShifts(params: {
  outletId: string;
  from?: string;
  to?: string;
}): Promise<OwnerShiftRow[]> {
  const res = await apiClient.get(`/cashier-shifts`, { params });
  return res.data.data as OwnerShiftRow[];
}
