import { BaseService } from "./base.service";
import { CashierShiftRepository } from "../repositories/cashier-shift.repository";
import { StaffRepository } from "../repositories/staff.repository";
import { OutletRepository } from "../repositories/outlet.repository";

export class CashierShiftService extends BaseService {
  static async getActiveShift(params: { outletId: string; staffId: string }) {
    const { outletId, staffId } = params;
    return CashierShiftRepository.findActiveShift(outletId, staffId);
  }

  static async openShift(params: {
    outletId: string;
    staffId: string;
    openingCash: number;
    notes?: string;
  }) {
    const { outletId, staffId, openingCash, notes } = params;

    const staff = await StaffRepository.findById(staffId);
    if (!staff) this.notFound("Kasir tidak ditemukan.");
    if (staff.outletId !== outletId) {
      this.forbidden("Kasir tidak terdaftar pada outlet ini.");
    }

    const existing = await this.getActiveShift({ outletId, staffId });
    if (existing) {
      this.conflict("Shift masih terbuka. Tutup shift sebelumnya terlebih dahulu.");
    }

    return CashierShiftRepository.create({
      outletId,
      staffId,
      status: "OPEN",
      openedAt: new Date(),
      openingCash,
      notes,
      cashMovements: openingCash > 0 ? {
        create: {
          type: "OPENING_CASH",
          amount: openingCash,
          note: "Opening cash",
        },
      } : undefined,
    });
  }

  static async closeShift(params: {
    shiftId: string;
    staffId: string;
    closingCash: number;
    notes?: string;
  }) {
    const { shiftId, staffId, closingCash, notes } = params;

    const shift = await CashierShiftRepository.findById(shiftId);
    if (!shift) this.notFound("Shift tidak ditemukan.");
    if (shift.staffId !== staffId) this.forbidden("Anda tidak berhak menutup shift ini.");
    if (shift.status !== "OPEN" || shift.closedAt) {
      this.badRequest("Shift sudah ditutup.");
    }

    return CashierShiftRepository.update(shiftId, {
      status: "CLOSED",
      closedAt: new Date(),
      closingCash,
      notes: notes ?? shift.notes ?? undefined,
    });
  }

  static async createMovement(params: {
    shiftId: string;
    staffId: string;
    type: "CASH_DROP" | "PAID_OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
    amount: number;
    note?: string;
  }) {
    const { shiftId, staffId, type, amount, note } = params;

    const shift = await CashierShiftRepository.findById(shiftId);
    if (!shift) this.notFound("Shift tidak ditemukan.");
    if (shift.staffId !== staffId) this.forbidden("Anda tidak berhak mengubah shift ini.");
    if (shift.status !== "OPEN" || shift.closedAt) {
      this.badRequest("Shift sudah ditutup.");
    }

    return CashierShiftRepository.createMovement({
      shiftId,
      type,
      amount,
      note,
    });
  }

  static async listShiftsForOwner(params: {
    businessId: string;
    outletId: string;
    from?: Date;
    to?: Date;
  }) {
    const { businessId, outletId, from, to } = params;

    const outlet = await OutletRepository.findById(outletId);
    if (!outlet) this.notFound("Outlet tidak ditemukan.");
    if (outlet.businessId !== businessId) this.forbidden("Unauthorized.");

    const shifts = await CashierShiftRepository.findMany({
      outletId,
      from,
      to,
    });

    const enriched = await Promise.all(
      (shifts as any[]).map(async (s) => {
        const txAgg = await CashierShiftRepository.sumSales(s.id);
        const cashAgg = await CashierShiftRepository.sumCashSales(s.id);
        const qrisAgg = await CashierShiftRepository.sumQrisSales(s.id);

        const movementNet = (s.cashMovements || []).reduce((sum: number, m: any) => {
          if (m.type === "PAID_OUT" || m.type === "CASH_DROP" || m.type === "ADJUSTMENT_OUT") return sum - m.amount;
          return sum + m.amount;
        }, 0);

        return {
          ...s,
          totals: {
            transactionCount: (txAgg as any)?._count?._all ?? 0,
            salesTotal: (txAgg as any)?._sum?.amount ?? 0,
            cashSalesTotal: (cashAgg as any)?._sum?.amount ?? 0,
            qrisSalesTotal: (qrisAgg as any)?._sum?.amount ?? 0,
            cashMovementNet: movementNet,
          },
        };
      }),
    );

    return enriched;
  }
}
