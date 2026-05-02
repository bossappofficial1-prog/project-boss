import { BillStatus, OrderStatus } from "@prisma/client";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { BillRepository } from "../repositories/bill.repository";
import { PosV2Repository } from "../repositories/pos-v2.repository";
import { handlePaymentSuccess } from "./payment-update.service";

function mapBill(bill: any) {
  return {
    id: bill.id,
    outletId: bill.outletId,
    tableId: bill.tableId,
    status: bill.status,
    total: Number(bill.total ?? 0),
    createdAt: bill.createdAt,
    closedAt: bill.closedAt,
    updatedAt: bill.updatedAt,
    table: bill.table,
    orders: (bill.orders ?? []).map((order: any) => ({
      id: order.id,
      totalAmount: Number(order.totalAmount ?? 0),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      guestCustomer: order.guestCustomer,
      transaction: order.transaction,
      items: order.items,
    })),
  };
}

export class BillService {
  static async createBill(outletId: string, tableId: string) {
    const table = await PosV2Repository.findTableByIdAndOutlet(tableId, outletId);
    if (!table) {
      throw new AppError("Meja tidak ditemukan pada outlet aktif.", HttpStatus.NOT_FOUND);
    }

    if (table.status === "BILLED") {
      throw new AppError("Meja ini sudah memiliki bill aktif.", HttpStatus.BAD_REQUEST);
    }

    if (table.status !== "OCCUPIED") {
      throw new AppError("Bill hanya bisa dibuat untuk meja berstatus OCCUPIED.", HttpStatus.BAD_REQUEST);
    }

    const activeBill = await BillRepository.findActiveByTable(tableId);
    if (activeBill) {
      throw new AppError("Meja ini sudah memiliki bill aktif.", HttpStatus.BAD_REQUEST);
    }

    const activeOrders = await PosV2Repository.getOrdersByTableId(tableId);
    if (activeOrders.length === 0) {
      throw new AppError("Tidak ada pesanan aktif untuk meja ini.", HttpStatus.BAD_REQUEST);
    }

    const orderIds = activeOrders.map((order) => order.id);
    const total = activeOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

    const bill = await BillRepository.createWithOrders({
      outletId,
      tableId,
      total,
      orderIds,
    });

    const createdBill = await BillRepository.findById(bill.id);
    return mapBill(createdBill);
  }

  static async getBillById(id: string) {
    const bill = await BillRepository.findById(id);
    if (!bill) {
      throw new AppError("Bill tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    return mapBill(bill);
  }

  static async listBills(outletId: string, status?: BillStatus) {
    const bills = await BillRepository.findMany({ outletId, status });
    return bills.map(mapBill);
  }

  static async payBill(id: string) {
    const bill = await BillRepository.findById(id);
    if (!bill) {
      throw new AppError("Bill tidak ditemukan", HttpStatus.NOT_FOUND);
    }

    if (bill.status === BillStatus.PAID) {
      return mapBill(bill);
    }

    const activeOrders = (bill.orders ?? []).filter((order: any) =>
      ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.orderStatus),
    );

    for (const order of activeOrders) {
      await handlePaymentSuccess(order.id);
    }

    await BillRepository.markPaid(id);
    await PosV2Repository.updateTableStatus(bill.tableId, "AVAILABLE");

    const updatedBill = await BillRepository.findById(id);
    return mapBill(updatedBill);
  }
}