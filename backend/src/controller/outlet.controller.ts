import { Request, Response } from "express";
import { HttpStatus } from "../constants/http-status";
import { BaseController } from "./base.controller";
import { OutletService } from "../service/outlet.service";

class OutletController extends BaseController {
  findNearbyOutlets = this.handler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius, page, limit, search } = req.query;

    if (!latitude || !longitude) {
      return this.error(
        res,
        "Latitude and longitude are required",
        [],
        HttpStatus.BAD_REQUEST,
      );
    }
    const latNum = parseFloat(latitude as string);
    const lngNum = parseFloat(longitude as string);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return this.error(
        res,
        "Latitude and longitude must be valid numbers",
        [],
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsedRadius = radius ? parseFloat(radius as string) : 5;
    if (parsedRadius > 50) {
      return this.error(
        res,
        "Radius maksimal 50km",
        [],
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await OutletService.findNearbyOutlets(
      latNum,
      lngNum,
      parsedRadius,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10,
      search as string,
    );

    return this.paginated(
      res,
      result.outlets,
      result.page,
      result.limit,
      result.totalPages,
    );
  });

  findOutletsInViewport = this.handler(async (req: Request, res: Response) => {
    const { latMin, latMax, lngMin, lngMax, search } = req.query;

    if (!latMin || !latMax || !lngMin || !lngMax) {
      return this.error(
        res,
        "latMin, latMax, lngMin, lngMax are required",
        [],
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsedLatMin = parseFloat(latMin as string);
    const parsedLatMax = parseFloat(latMax as string);
    const parsedLngMin = parseFloat(lngMin as string);
    const parsedLngMax = parseFloat(lngMax as string);

    if ([parsedLatMin, parsedLatMax, parsedLngMin, parsedLngMax].some(isNaN)) {
      return this.error(
        res,
        "Semua parameter bounding box harus berupa angka",
        [],
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await OutletService.findOutletsInViewport(
      parsedLatMin,
      parsedLatMax,
      parsedLngMin,
      parsedLngMax,
      search as string | undefined,
    );

    return this.success(res, result.outlets, HttpStatus.OK);
  });

  updateLocation = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { latitude, longitude } = req.body;
    const ownerId = req.storedUser!.id;

    const outlet = await OutletService.updateLocation(
      outletId,
      ownerId,
      parseFloat(latitude),
      parseFloat(longitude),
    );

    return this.success(res, outlet, HttpStatus.OK);
  });

  create = this.handler(async (req: Request, res: Response) => {
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const outlet = await OutletService.create(payload, ownerId);
    return this.success(res, outlet, HttpStatus.CREATED);
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const outlet = await OutletService.getById(id);
    return this.success(res, outlet);
  });

  getBySlug = this.handler(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const outlet = await OutletService.getBySlug(slug);
    return this.success(res, outlet);
  });

  getAll = this.handler(async (req: Request, res: Response) => {
    const { search, take, skip } = req.query;

    const parsedTake = take ? parseInt(take as string) : 10;
    const parsedSkip = skip ? parseInt(skip as string) : 0;

    const { outlets, total } = await OutletService.getAll(
      search as string,
      parsedTake,
      parsedSkip,
    );
    return this.paginated(
      res,
      outlets,
      parsedSkip / parsedTake + 1,
      parsedTake,
      total,
    );
  });

  getByBusinessId = this.handler(async (req: Request, res: Response) => {
    const businessId = req.params.businessId as string;
    const { search, take, skip } = req.query;

    const parsedTake = take ? parseInt(take as string) : 10;
    const parsedSkip = skip ? parseInt(skip as string) : 0;

    const { outlets, total } = await OutletService.getByBusinessId(
      businessId,
      search as string,
      parsedTake,
      parsedSkip,
    );
    return this.paginated(
      res,
      outlets,
      parsedSkip / parsedTake + 1,
      parsedTake,
      total,
    );
  });

  getFeatured = this.handler(async (req: Request, res: Response) => {
    const outlets = await OutletService.getFeatured();
    return this.success(res, outlets);
  });

  update = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payload = req.body;
    const ownerId = req.storedUser!.id;
    const outlet = await OutletService.update(id, payload, ownerId);
    return this.success(res, outlet);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerId = req.storedUser!.id;
    const outlet = await OutletService.delete(id, ownerId);
    return this.success(res, outlet);
  });

  getSlugs = this.handler(async (req: Request, res: Response) => {
    const outlets = await OutletService.getSlugs();
    return this.success(res, outlets);
  });

  uploadQRIS = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.id as string;
    const ownerId = req.storedUser!.id;
    const result = await OutletService.uploadQRIS(
      outletId,
      ownerId,
      req.body.fileUrl,
    );

    return this.success(
      res,
      result,
      HttpStatus.OK,
      "QRIS berhasil diupload",
    );
  });

  getQRIS = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.id as string;
    const qrisData = await OutletService.getQRIS(outletId);

    return this.success(
      res,
      qrisData,
      HttpStatus.OK,
      "Data QRIS berhasil diambil",
    );
  });

  getRevenueTrend = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    if (!outletId) {
      return this.error(res, "Outlet ID diperlukan", [], HttpStatus.BAD_REQUEST);
    }

    const timeframeParam = (req.query.timeframe as string) ?? "30d";
    type RevenueTimeframe = "7d" | "30d" | "3m" | "custom";
    const allowedTimeframes: RevenueTimeframe[] = ["7d", "30d", "3m", "custom"];
    const timeframe = allowedTimeframes.includes(
      timeframeParam as RevenueTimeframe,
    )
      ? (timeframeParam as RevenueTimeframe)
      : "30d";

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const trend = await OutletService.getRevenueTrend(outletId, {
      timeframe,
      startDate,
      endDate,
    });

    return this.success(res, trend);
  });

  getAnalytics = this.handler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;

    if (!outletId) {
      return this.error(res, "Outlet ID diperlukan", [], HttpStatus.BAD_REQUEST);
    }

    const analytics = await OutletService.getAnalytics(outletId);

    return this.success(res, analytics);
  });
}

export const outletController = new OutletController();

// Legacy compatibility exports to prevent breaking other files
export const findNearbyOutletsController = outletController.findNearbyOutlets;
export const findOutletsInViewportController = outletController.findOutletsInViewport;
export const updateOutletLocationController = outletController.updateLocation;
export const createOutletController = outletController.create;
export const getOutletByIdController = outletController.getById;
export const getOutletBySlugController = outletController.getBySlug;
export const getAllOutletsController = outletController.getAll;
export const getOutletsByBusinessIdController = outletController.getByBusinessId;
export const getFeaturedOutletsController = outletController.getFeatured;
export const updateOutletController = outletController.update;
export const deleteOutletController = outletController.delete;
export const getOutletSlugsController = outletController.getSlugs;
export const uploadQRISController = outletController.uploadQRIS;
export const getQRISController = outletController.getQRIS;
export const getOutletRevenueTrendController = outletController.getRevenueTrend;
export const getOutletAnalyticsController = outletController.getAnalytics;
