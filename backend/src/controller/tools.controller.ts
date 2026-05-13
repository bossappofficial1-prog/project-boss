import { Request, Response } from "express";
import { asyncHandler } from "src/middleware/error.middleware";
import { ToolsService } from "src/service/tools.service";
import { ResponseUtil } from "src/utils";

export class ToolsController {
  constructor(private toolsService: ToolsService) {}

  /**
   * Handler untuk Profit Per Product
   */
  public getProfitPerProduct = async (req: Request, res: Response) => {
    try {
      const { outletId, startDate, endDate } = req.query;

      // Validasi input
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
    } catch (error: any) {
      return ResponseUtil.error(res, error.message || "Internal Server Error");
    }
  };

  /**
   * Handler untuk Business Health
   */
  public getBusinessHealth = asyncHandler(
    async (req: Request, res: Response) => {
      try {
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
      } catch (error: any) {
        return ResponseUtil.error(
          res,
          error.message || "Internal Server Error",
        );
      }
    },
  );
}
