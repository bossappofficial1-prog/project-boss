import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AccountingService } from "../service/accounting.service";
import { HttpStatus } from "../constants/http-status";

class AccountingController extends BaseController {
  getAccounts = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const result = await AccountingService.getAccounts(businessId);
    return this.success(res, result, HttpStatus.OK, "Daftar akun berhasil diambil");
  });

  createAccount = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const result = await AccountingService.createAccount(businessId, req.body);
    return this.success(res, result, HttpStatus.CREATED, "Akun baru berhasil dibuat");
  });

  updateAccount = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = req.storedUser!.businessId;
    const result = await AccountingService.updateAccount(id, businessId, req.body);
    return this.success(res, result, HttpStatus.OK, "Nama akun berhasil diperbarui");
  });

  deleteAccount = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = req.storedUser!.businessId;
    await AccountingService.deleteAccount(id, businessId);
    return this.success(res, null, HttpStatus.OK, "Akun berhasil dihapus");
  });

  getJournalEntries = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const query = req.query as any;
    const result = await AccountingService.getJournalEntries(businessId, query);
    return this.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total
    );
  });

  createJournalEntry = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const result = await AccountingService.createJournalEntry(businessId, req.body);
    return this.success(res, result, HttpStatus.CREATED, "Jurnal umum manual berhasil dicatat");
  });

  getBalanceSheet = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const { date } = req.query as { date?: string };
    const result = await AccountingService.getBalanceSheet(businessId, date);
    return this.success(res, result, HttpStatus.OK, "Laporan neraca keuangan berhasil dihitung");
  });

  getProfitLoss = this.handler(async (req: Request, res: Response) => {
    const businessId = req.storedUser!.businessId;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const result = await AccountingService.getProfitLoss(businessId, startDate, endDate);
    return this.success(res, result, HttpStatus.OK, "Laporan laba rugi berhasil dihitung");
  });

  deleteJournalEntry = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = req.storedUser!.businessId;
    await AccountingService.deleteJournalEntry(id, businessId);
    return this.success(res, null, HttpStatus.OK, "Entri jurnal berhasil dihapus");
  });
}

export const accountingController = new AccountingController();
