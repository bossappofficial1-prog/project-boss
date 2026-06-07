import { Request, Response } from "express";
import { ManualTransactionService } from "../service/manual-transaction.service";
import { createManualTransactionSchema } from "../schemas/manual-transaction.schema";
import { BaseController } from "./base.controller";

export class ManualTransactionController extends BaseController {
  create = this.handler(async (req: Request, res: Response) => {
    const validatedData = createManualTransactionSchema.parse(req.body);

    const result = await ManualTransactionService.createManualTransaction({
      outletId: validatedData.outletId,
      transactionDate: new Date(validatedData.transactionDate),
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      amount: validatedData.amount,
      items: validatedData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        bookingDate: item.bookingDate ? new Date(item.bookingDate) : undefined,
      })),
    });

    return this.success(res, result, 201, "Transaksi manual berhasil dibuat");
  });
}

export const manualTransactionController = new ManualTransactionController();