import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { getHomeSummaryService } from "../service/home.service";

export const getHomeSummaryController = asyncHandler(async (req: Request, res: Response) => {
    const { search } = req.query;
    const summary = await getHomeSummaryService(search as string);
    return ResponseUtil.success(res, summary);
});