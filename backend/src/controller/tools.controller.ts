import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ToolsService } from "../service/tools.service";
import { ResponseUtil } from "../utils";

export class ToolsController {
  constructor(private toolsService: ToolsService) {}

  /**
   * Handler untuk Profit Per Product
   */
  public getProfitPerProduct = asyncHandler(
    async (req: Request, res: Response) => {
      const { outletId, startDate, endDate } = req.query;

      if (!outletId || !startDate || !endDate) {
        return ResponseUtil.badRequest(
          res,
          "outletId, startDate, dan endDate harus diisi.",
        );
      }

      const result = await this.toolsService.getProfitPerProduct(
        outletId as string,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      return ResponseUtil.success(res, result);
    },
  );

  /**
   * Handler untuk Business Health
   */
  public getBusinessHealth = asyncHandler(
    async (req: Request, res: Response) => {
      const { outletId, startDate, endDate } = req.query;

      if (!outletId || !startDate || !endDate) {
        return ResponseUtil.badRequest(res, "Parameter tidak lengkap.");
      }

      const result = await this.toolsService.getBusinessHealth(
        outletId as string,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      return ResponseUtil.success(res, result);
    },
  );

  public getIncomeStatement = asyncHandler(
    async (req: Request, res: Response) => {
      const { outletId, startDate, endDate } = req.query;

      if (!outletId || !startDate || !endDate) {
        return ResponseUtil.badRequest(res, "Parameter tidak lengkap.");
      }

      const result = await this.toolsService.getIncomeStatement(
        outletId as string,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      return ResponseUtil.success(res, result);
    },
  );

  public getPeakHours = asyncHandler(async (req: Request, res: Response) => {
    const { outletId, startDate, endDate } = req.query;

    if (!outletId || !startDate || !endDate) {
      return ResponseUtil.badRequest(res, "Parameter tidak lengkap.");
    }

    const result = await this.toolsService.getPeakHours(
      outletId as string,
      new Date(startDate as string),
      new Date(endDate as string),
    );

    return ResponseUtil.success(res, result);
  });
}
