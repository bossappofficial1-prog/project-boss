import { ServiceStatus } from "@prisma/client";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { BaseService } from "./base.service";
import { db } from "../config/prisma";
import { OutletRepository } from "../repositories/outlet.repository";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";
import { getBusinessByOwnerIdService } from "./business.service";
import {
  getIsOutletOpen,
  getIsOutletOnBreak,
  calculateDistance,
  validateCoordinates,
  calculateBoundingBox,
  validatePaginationParams,
  validateRadius,
  mapOutletsWithOpenStatus,
  removeOperatingHoursFromOutlets,
} from "../utils/outlet.utils";
import { ImageService } from "./image.service";
import { EventPublisher } from "../events/publisher";
import { decodeQRFromUrl } from "../utils/qr-decoder";
import { PlanLimitService } from "./plan-limit.service";
import { redis } from "../config/redis";

export async function createOutletService(
  data: CreateOutletInput,
  ownerId: string,
) {
  const business = await getBusinessByOwnerIdService(ownerId);
  redis.del(`user:${ownerId}`);
  if (business.id !== data.businessId) {
    throw new AppError(
      "Anda tidak berhak menambahkan outlet ke bisnis ini.",
      HttpStatus.FORBIDDEN,
    );
  }

  if (
    data.type === "CUSTOM" &&
    business.subscriptionPlan !== "TRIAL" &&
    business.subscriptionPlan !== "PRO"
  ) {
    throw new AppError(
      "Tipe outlet CUSTOM hanya tersedia untuk paket TRIAL atau PRO.",
      HttpStatus.BAD_REQUEST,
    );
  }

  if (data.email) {
    const existingEmail = await OutletRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError(
        "Email outlet ini sudah terdaftar.",
        HttpStatus.BAD_REQUEST,
      );
    }
  } else {
    data.email = undefined;
  }

  await PlanLimitService.assertCanCreateOutlet(business.id);
  try {
    const outlet = await OutletRepository.create(data);
    if (outlet.latitude !== null && outlet.longitude !== null) {
      await OutletRepository.syncGeoLocation(outlet.id, outlet.longitude, outlet.latitude);
    }
    await EventPublisher.publishOutletCreated(outlet);
    await PlanLimitService.invalidateUsageCache(business.id);
    await invalidateMapCache(outlet.id);
    return outlet;
  } catch (error: any) {
    if (error.code == "P2002") {
      throw new AppError(
        "Slug outlet sudah terdaftar. Silahkan gunakan nama outlet yang berbeda.",
        HttpStatus.BAD_REQUEST,
      );
    }
    throw error;
  }
}

export async function getOutletSlugsService() {
  return await OutletRepository.getOutletSlugs();
}

export async function findNearbyOutletsService(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
  page: number = 1,
  limit: number = 10,
  search?: string,
) {
  // Validate inputs using utilities
  try {
    validateRadius(radiusKm);
    validatePaginationParams(page, limit);
    validateCoordinates(latitude, longitude);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : "Invalid input parameters",
      HttpStatus.BAD_REQUEST,
    );
  }

  // Calculate bounding box
  const { latMin, latMax, longMin, longMax } = calculateBoundingBox(
    latitude,
    longitude,
    radiusKm,
  );

  // Get paginated outlets from repository
  const { outlets: outletsRaw, total } =
    await OutletRepository.findNearbyWithPagination(
      latitude,
      longitude,
      latMin,
      latMax,
      longMin,
      longMax,
      page,
      limit,
      search,
    );

  // Calculate exact distances and filter within radius
  const outletsWithDistance = outletsRaw
    .map((outlet) => {
      if (!outlet.latitude || !outlet.longitude) return null;

      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: outlet.latitude, longitude: outlet.longitude },
      );

      // Only include outlets within the exact radius
      if (distance > radiusKm) return null;

      return {
        ...outlet,
        distance: Number(distance.toFixed(2)),
      };
    })
    .filter((outlet): outlet is NonNullable<typeof outlet> => outlet !== null)
    .sort((a, b) => {
      // Sort by distance first, then by number of orders
      if (Math.abs(a.distance - b.distance) < 0.1) {
        // If distances are similar (within 100m)
        return (b._count?.orders || 0) - (a._count?.orders || 0); // Sort by popularity
      }
      return a.distance - b.distance;
    });

  const outlets = mapOutletsWithOpenStatus(outletsWithDistance);
  const nearbyOutlets = removeOperatingHoursFromOutlets(outlets);

  return {
    outlets: nearbyOutlets,
    total: outletsWithDistance.length,
    page,
    limit,
    totalPages: Math.ceil(outletsWithDistance.length / limit),
  };
}

/**
 * Helper function untuk menghapus cache Redis menggunakan pattern dengan metode SCAN.
 * SCAN aman untuk production karena memproses secara bertahap tanpa memblokir server Redis.
 */
async function deleteKeysByPattern(pattern: string) {
  try {
    let cursor = "0";
    do {
      const reply = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error("Gagal menghapus cache dengan pattern:", error);
  }
}

/**
 * Hapus seluruh cache yang berkaitan dengan map outlet.
 */
export async function invalidateMapCache(outletId?: string) {
  await deleteKeysByPattern("outlets:map:*");
  if (outletId) {
    await redis.del(`outlets:detail:${outletId}`);
  } else {
    await deleteKeysByPattern("outlets:detail:*");
  }
}

export class OutletService extends BaseService {
  static create = createOutletService;
  static getSlugs = getOutletSlugsService;
  static findNearbyOutlets = findNearbyOutletsService;
  static updateLocation = updateOutletLocationService;
  static getById = getOutletByIdService;
  static getBySlug = getOutletBySlugService;
  static getAll = getAllOutletsService;
  static getByBusinessId = getOutletsByBusinessIdService;
  static update = updateOutletService;
  static delete = deleteOutletService;
  static getFeatured = getFeaturedOutletsService;
  static uploadQRIS = uploadQRISService;
  static getQRIS = getQRISService;
  static getRevenueTrend = getOutletRevenueTrend;
  static getAnalytics = getOutletAnalytics;

  /**
   * Cari outlet berdasarkan bounding box viewport peta menggunakan Redis Geospatial.
   * Dan melakukan fallback ke database query jika Redis Geospatial bermasalah.
   */
  static async findOutletsInViewport(
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number,
    search?: string,
  ) {
    // Validasi bounding box
    if (latMin >= latMax || lngMin >= lngMax) {
      this.badRequest("Invalid bounding box: min harus lebih kecil dari max");
    }
    if (latMin < -90 || latMax > 90 || lngMin < -180 || lngMax > 180) {
      this.badRequest("Bounding box di luar range koordinat yang valid");
    }

    // Rounding 4 desimal untuk normalisasi cache key
    const r = (n: number) => Math.round(n * 10000) / 10000;
    const cacheKey = `outlets:map:${r(latMin)}:${r(latMax)}:${r(lngMin)}:${r(lngMax)}${search ? `:${search.trim().toLowerCase()}` : ""}`;

    // Cek Redis JSON cache dulu
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return { outlets: JSON.parse(cached), fromCache: true };
      }
    } catch {
      // Abaikan jika Redis error, lanjut ke Geospatial / DB
    }

    // Pastikan geospatial cache terisi (self-heating cache)
    try {
      const exists = await redis.zcard("outlets:geo");
      if (exists === 0) {
        const allOutlets = await OutletRepository.findAllWithCoordinates();
        if (allOutlets.length > 0) {
          const pipeline = redis.pipeline();
          for (const outlet of allOutlets) {
            if (outlet.longitude !== null && outlet.latitude !== null) {
              pipeline.geoadd("outlets:geo", outlet.longitude, outlet.latitude, outlet.id);
            }
          }
          await pipeline.exec();
        }
      }
    } catch (err) {
      console.warn("Gagal memanaskan geospatial cache:", err);
    }

    // Hitung parameter untuk pencarian Geosearch BYBOX
    const centerLng = (lngMin + lngMax) / 2;
    const centerLat = (latMin + latMax) / 2;
    // Jarak 1 derajat lintang = 110.57 km
    const heightKm = Math.abs(latMax - latMin) * 110.57;
    // Jarak 1 derajat bujur = 111.32 km * cos(lat)
    const widthKm = Math.abs(lngMax - lngMin) * 111.32 * Math.cos(((latMin + latMax) * Math.PI) / 360);

    let outlets: any[] = [];
    let fromGeospatial = false;

    try {
      // Query pencarian bounding box geospatial dengan Redis
      const outletIds = await redis.geosearch(
        "outlets:geo",
        "FROMLONLAT",
        centerLng,
        centerLat,
        "BYBOX",
        widthKm,
        heightKm,
        "km"
      ) as string[];

      if (outletIds && outletIds.length > 0) {
        const keys = outletIds.map(id => `outlets:detail:${id}`);
        const cachedData = await redis.mget(...keys);

        const cachedOutlets: any[] = [];
        const missingIds: string[] = [];

        for (let i = 0; i < outletIds.length; i++) {
          const id = outletIds[i];
          const data = cachedData[i];
          if (data) {
            try {
              cachedOutlets.push(JSON.parse(data));
            } catch {
              missingIds.push(id);
            }
          } else {
            missingIds.push(id);
          }
        }

        let fetchedOutlets: any[] = [];
        if (missingIds.length > 0) {
          fetchedOutlets = await db.outlet.findMany({
            where: {
              id: { in: missingIds }
            },
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                },
              },
              operatingHours: true,
              _count: {
                select: {
                  staff: true,
                  products: true,
                },
              },
            },
          });

          // Simpan outlet yang di-fetch baru ke Redis detail cache
          if (fetchedOutlets.length > 0) {
            const pipeline = redis.pipeline();
            for (const o of fetchedOutlets) {
              pipeline.set(`outlets:detail:${o.id}`, JSON.stringify(o), "EX", 86400); // 24 jam
            }
            await pipeline.exec();
          }
        }

        const allRawOutlets = [...cachedOutlets, ...fetchedOutlets];

        // Filter pencarian nama secara case-insensitive di memori
        let filteredOutlets = allRawOutlets;
        if (search && search.trim() !== "") {
          const searchLower = search.trim().toLowerCase();
          filteredOutlets = allRawOutlets.filter(o => o.name && o.name.toLowerCase().includes(searchLower));
        }

        const outletsWithStatus = mapOutletsWithOpenStatus(filteredOutlets);
        outlets = removeOperatingHoursFromOutlets(outletsWithStatus);
        fromGeospatial = true;
      }
    } catch (err) {
      console.warn("Redis GEOSEARCH/MGET bermasalah, menggunakan fallback query database:", err);
      // Fallback ke standard database query
      const outletsRaw = await db.outlet.findMany({
        where: {
          AND: [
            { latitude: { gte: latMin } },
            { latitude: { lte: latMax } },
            { longitude: { gte: lngMin } },
            { longitude: { lte: lngMax } },
            { latitude: { not: null } },
            { longitude: { not: null } },
            ...(search && search.trim() !== "" ? [{
              name: { contains: search.trim(), mode: "insensitive" as const }
            }] : [])
          ]
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
          operatingHours: true,
          _count: {
            select: {
              staff: true,
              products: true,
            },
          },
        },
      });

      const outletsWithStatus = mapOutletsWithOpenStatus(outletsRaw);
      outlets = removeOperatingHoursFromOutlets(outletsWithStatus);
    }

    // Simpan hasil ke cache JSON (TTL 24 jam)
    try {
      if (outlets.length > 0) {
        await redis.set(cacheKey, JSON.stringify(outlets), "EX", 86400);
      }
    } catch {
      // Abaikan jika gagal simpan cache
    }

    return { outlets, fromCache: false, fromGeospatial };
  }
}

export const findOutletsInViewportService = OutletService.findOutletsInViewport;

export async function updateOutletLocationService(
  outletId: string,
  ownerId: string,
  latitude: number,
  longitude: number,
) {
  // Check ownership
  const outlet = await OutletRepository.findById(outletId);
  if (!outlet) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const business = await getBusinessByOwnerIdService(ownerId);
  if (outlet.businessId !== business.id) {
    throw new AppError(
      "Anda tidak berhak mengupdate outlet ini.",
      HttpStatus.FORBIDDEN,
    );
  }

  // Validate coordinates using utility
  try {
    validateCoordinates(latitude, longitude);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : "Invalid coordinates",
      HttpStatus.BAD_REQUEST,
    );
  }

  const updated = await OutletRepository.update(outletId, {
    latitude,
    longitude,
  });
  await OutletRepository.syncGeoLocation(outletId, longitude, latitude);
  await invalidateMapCache(outletId);
  return updated;
}

export async function getOutletByIdService(id: string, date?: Date) {
  const today = date || new Date();
  const outletRaw = await OutletRepository.findById(id);
  if (!outletRaw) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
  const { operatingHours, ...outlet } = outletRaw;

  const isOpenOutlet =
    outlet.isOpen &&
    (operatingHours.length > 0
      ? getIsOutletOpen(operatingHours, today)
      : false);

  const isBreakOutlet =
    outlet.isOpen &&
    (operatingHours.length > 0
      ? getIsOutletOnBreak(operatingHours, today)
      : false);

  return {
    ...outlet,
    operatingHours,
    isOpen: isOpenOutlet,
    isBreak: isBreakOutlet,
    status: isOpenOutlet,
  };
}

export async function getOutletBySlugService(id: string, date?: Date) {
  const today = date || new Date();
  const outletRaw = await OutletRepository.findBySlug(id);
  if (!outletRaw) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
  const { operatingHours, ...outlet } = outletRaw;

  const isOpenOutlet =
    outlet.isOpen &&
    (operatingHours.length > 0
      ? getIsOutletOpen(operatingHours, today)
      : false);

  const isBreakOutlet =
    outlet.isOpen &&
    (operatingHours.length > 0
      ? getIsOutletOnBreak(operatingHours, today)
      : false);

  return {
    ...outlet,
    operatingHours,
    isOpen: isOpenOutlet,
    isBreak: isBreakOutlet,
    status: isOpenOutlet,
  };
}

export async function getAllOutletService() {
  const outlet = await OutletRepository.getAll();
  if (!outlet) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
  return outlet;
}

export async function getOutletsByBusinessIdService(
  businessId: string,
  search?: string,
  take?: number,
  skip?: number,
) {
  const { outlets: outletsRaw, total } =
    await OutletRepository.findManyWithPagination(
      businessId,
      search,
      take,
      skip,
    );

  const outlets = mapOutletsWithOpenStatus(outletsRaw);

  return { outlets, total };
}

export async function updateOutletService(
  id: string,
  data: UpdateOutletInput,
  ownerId: string,
) {
  const outlet = await getOutletByIdService(id);
  const business = await getBusinessByOwnerIdService(ownerId);
  if (business.id !== outlet.businessId) {
    throw new AppError(
      "Anda tidak berhak mengubah outlet ini.",
      HttpStatus.FORBIDDEN,
    );
  }

  if (
    data.type === "CUSTOM" &&
    business.subscriptionPlan !== "TRIAL" &&
    business.subscriptionPlan !== "PRO"
  ) {
    throw new AppError(
      "Tipe outlet CUSTOM hanya tersedia untuk paket TRIAL atau PRO.",
      HttpStatus.BAD_REQUEST,
    );
  }

  if (data.email) {
    const existingEmail = await OutletRepository.findByEmail(data.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new AppError(
        "Email outlet ini sudah terdaftar.",
        HttpStatus.BAD_REQUEST,
      );
    }
  } else if (data.email === "") {
    data.email = null as any; // Allow unsetting email
  }

  // Try to decode QRIS string automatically if manualQrImageUrl is provided and qrisString is not explicitly sent/changed
  if (data.manualQrImageUrl && !data.qrisString) {
    const decoded = await decodeQRFromUrl(data.manualQrImageUrl);
    if (decoded) {
      data.qrisString = decoded;
    }
  }

  const updatedOutlet = await OutletRepository.update(id, data);

  // Sinkronisasikan ke Redis Geospatial jika koordinat diperbarui
  if (updatedOutlet && updatedOutlet.latitude !== null && updatedOutlet.longitude !== null) {
    await OutletRepository.syncGeoLocation(id, updatedOutlet.longitude, updatedOutlet.latitude);
  }

  if (data.image && outlet.image && updatedOutlet) {
    ImageService.deleteImageByUrl(outlet.image);
  }

  if (data.manualQrImageUrl && outlet.manualQrImageUrl) {
    ImageService.deleteImageByUrl(outlet.manualQrImageUrl);
  }
  redis.del(`user:${ownerId}`);
  if (data.manualQrImageUrl && outlet.manualQrImageUrl)
    ImageService.deleteImageByUrl(outlet.manualQrImageUrl);
  await invalidateMapCache(id);
  return updatedOutlet;
}

export async function deleteOutletService(id: string, ownerId: string) {
  const outlet = await getOutletByIdService(id);
  const business = await getBusinessByOwnerIdService(ownerId);
  if (business.id !== outlet.businessId) {
    throw new AppError(
      "Anda tidak berhak menghapus outlet ini.",
      HttpStatus.FORBIDDEN,
    );
  }
  const deletedOutlet = await OutletRepository.delete(id);
  
  // Hapus dari indeks geopasial Redis
  try {
    await redis.zrem("outlets:geo", id);
  } catch (err) {
    console.warn("Gagal menghapus outlet dari indeks geospatial:", err);
  }

  redis.del(`user:${ownerId}`);
  if (outlet.image) ImageService.deleteImageByUrl(outlet.image);
  await PlanLimitService.invalidateUsageCache(business.id);
  await invalidateMapCache(id);
  return deletedOutlet;
}

export async function getAllOutletsService(
  search?: string,
  take?: number,
  skip?: number,
) {
  const { outlets: outletRaw, total } =
    await OutletRepository.findManyWithPagination(
      undefined,
      search,
      take,
      skip,
    );

  const outlets = mapOutletsWithOpenStatus(outletRaw);

  return { outlets, total };
}

export async function getFeaturedOutletsService() {
  const cacheKey = "featured_outlets";
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const outlets = await OutletRepository.findFeaturedOutlets();

  const featuredOutlets = mapOutletsWithOpenStatus(outlets);
  const result = removeOperatingHoursFromOutlets(featuredOutlets);

  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(result));

  return result;
}

export async function uploadQRISService(
  outletId: string,
  ownerId: string,
  fileUrl: string,
) {
  const outlet = await OutletRepository.findById(outletId);

  if (outlet?.manualQrImageUrl)
    await ImageService.deleteImageByUrl(outlet.manualQrImageUrl);

  // Auto-decode QRIS string from uploaded image
  let qrisString: string | null = null;
  if (fileUrl) {
    qrisString = await decodeQRFromUrl(fileUrl);
  }

  // Update outlet dengan path QRIS baru
  const updatedOutlet = await OutletRepository.update(outletId, {
    manualQrImageUrl: fileUrl,
    qrisString: qrisString || undefined,
  });

  return {
    id: updatedOutlet.id,
    name: updatedOutlet.name,
    qrisImage: updatedOutlet.manualQrImageUrl,
    qrisUrl: updatedOutlet.manualQrImageUrl,
    updatedAt: updatedOutlet.updatedAt,
  };
}

export async function getQRISService(outletId: string) {
  const outlet = await OutletRepository.findById(outletId);

  if (!outlet) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return {
    outletId: outlet.id,
    outletName: outlet.name,
    businessName: outlet.business.name,
    qrisImageUrl: outlet.manualQrImageUrl,
    qrisString: outlet.qrisString,
  };
}

type AnalyticsTransaction = {
  paymentMethod?: string | null;
  manualMethod?: string | null;
  isManual?: boolean | null;
  amount?: number | null;
} | null;

type AnalyticsOrder = RevenueSource & {
  createdAt: Date | string;
  transaction?: AnalyticsTransaction;
  orderStatus?: string | null;
  paymentStatus?: string | null;
};

type PaymentOrder = RevenueSource & {
  createdAt: Date | string;
  paymentStatus: string;
  transaction?: AnalyticsTransaction & { status?: string | null };
};

type AnalyticsExpense = {
  id: string;
  amount: number;
  date: Date | string;
  description: string | null;
};

type RevenueSource = {
  totalAmount: number;
  appFee?: number | null;
  transactionFee?: number | null;
  midtransFee?: number | null;
};

type DateBoundaries = {
  now: Date;
  startOfToday: Date;
  startOfWeek: Date;
  startOfMonth: Date;
  startOfLastMonth: Date;
  endOfLastMonth: Date;
};

type ProductTypeCount = {
  type: string;
  _count: {
    _all: number;
  };
};

type TopProductItem = {
  productId: string;
  quantity: number;
  priceAtTimeOfOrder: number;
  product: {
    name: string;
    type: string;
    status: string;
  } | null;
};

type LowStockProduct = {
  id: string;
  name: string;
  quantity: number | null;
};

type RevenueTimeframe = "7d" | "30d" | "3m" | "custom";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function getNetRevenue(source: RevenueSource): number {
  const baseAmount = source.totalAmount ?? 0;
  const appFee = source.appFee ?? 0;
  const transactionFee = source.transactionFee ?? source.midtransFee ?? 0;
  const net = baseAmount - (appFee + transactionFee);
  if (!Number.isFinite(net)) {
    return 0;
  }
  return net < 0 ? 0 : net;
}

function aggregateDailyRevenue(orders: AnalyticsOrder[]) {
  const map = orders.reduce<
    Record<string, { date: string; revenue: number; orders: number }>
  >((acc, order) => {
    const created = toDate(order.createdAt);
    if (Number.isNaN(created.getTime())) return acc;

    const key = created.toISOString().slice(0, 10);
    if (!acc[key]) {
      acc[key] = { date: key, revenue: 0, orders: 0 };
    }

    acc[key].revenue += getNetRevenue(order);
    acc[key].orders += 1;
    return acc;
  }, {});

  return Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function summarizeOrderCounts(
  orders: AnalyticsOrder[],
  boundaries: DateBoundaries,
) {
  const todayOrders = orders.filter(
    (order) => toDate(order.createdAt) >= boundaries.startOfToday,
  ).length;
  const weekOrders = orders.filter(
    (order) => toDate(order.createdAt) >= boundaries.startOfWeek,
  ).length;
  const monthOrders = orders.filter(
    (order) => toDate(order.createdAt) >= boundaries.startOfMonth,
  ).length;

  return { todayOrders, weekOrders, monthOrders };
}

function aggregateOrderStatuses(orders: AnalyticsOrder[]) {
  const totalOrders = orders.length;
  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    const status = order.orderStatus ?? "UNKNOWN";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function aggregateOrderTrend(orders: AnalyticsOrder[]) {
  const map = orders.reduce<
    Record<
      string,
      { date: string; completed: number; cancelled: number; pending: number }
    >
  >((acc, order) => {
    const created = toDate(order.createdAt);
    if (Number.isNaN(created.getTime())) return acc;

    const key = created.toISOString().slice(0, 10);
    if (!acc[key]) {
      acc[key] = { date: key, completed: 0, cancelled: 0, pending: 0 };
    }

    const status = (order.orderStatus ?? "").toUpperCase();
    if (status === "COMPLETED") {
      acc[key].completed += 1;
    } else if (status === "CANCELLED") {
      acc[key].cancelled += 1;
    } else {
      acc[key].pending += 1;
    }

    return acc;
  }, {});

  return Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function aggregateDailyExpenses(expenses: AnalyticsExpense[]) {
  const map = expenses.reduce<
    Record<string, { date: string; expenses: number }>
  >((acc, expense) => {
    const expenseDate = toDate(expense.date);
    if (Number.isNaN(expenseDate.getTime())) return acc;

    const key = expenseDate.toISOString().slice(0, 10);
    if (!acc[key]) {
      acc[key] = { date: key, expenses: 0 };
    }

    acc[key].expenses += expense.amount;
    return acc;
  }, {});

  return Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function combineExpenseVsRevenue(
  revenueDaily: Array<{ date: string; revenue: number; orders: number }>,
  expenseDaily: Array<{ date: string; expenses: number }>,
) {
  const revenueMap = new Map(revenueDaily.map((item) => [item.date, item]));
  const expenseMap = new Map(expenseDaily.map((item) => [item.date, item]));

  const allDates = Array.from(
    new Set([...revenueMap.keys(), ...expenseMap.keys()]),
  ).sort();

  return allDates.map((date) => ({
    date,
    revenue: revenueMap.get(date)?.revenue ?? 0,
    expenses: expenseMap.get(date)?.expenses ?? 0,
  }));
}

function buildDateBoundaries(baseDate: Date): DateBoundaries {
  const now = new Date(baseDate);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfWeek = new Date(startOfToday);
  const dayIndex = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1;
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  return {
    now,
    startOfToday,
    startOfWeek,
    startOfMonth,
    startOfLastMonth,
    endOfLastMonth,
  };
}

function summarizePeriods(
  orders: AnalyticsOrder[],
  boundaries: DateBoundaries,
) {
  const todayRevenue = orders
    .filter((order) => new Date(order.createdAt) >= boundaries.startOfToday)
    .reduce((prev, current) => prev + getNetRevenue(current), 0);

  const weekRevenue = orders
    .filter((order) => new Date(order.createdAt) >= boundaries.startOfWeek)
    .reduce((prev, current) => prev + getNetRevenue(current), 0);

  const monthRevenue = orders
    .filter((order) => new Date(order.createdAt) >= boundaries.startOfMonth)
    .reduce((prev, current) => prev + getNetRevenue(current), 0);

  return { todayRevenue, weekRevenue, monthRevenue };
}

function summarizeLastMonth(
  orders: AnalyticsOrder[],
  boundaries: DateBoundaries,
  monthRevenue: number,
) {
  const lastMonthOrders = orders.filter((order) => {
    const created = new Date(order.createdAt);
    return (
      created >= boundaries.startOfLastMonth &&
      created <= boundaries.endOfLastMonth
    );
  });

  const lastMonthRevenue = lastMonthOrders.reduce(
    (prev, current) => prev + getNetRevenue(current),
    0,
  );

  const lastMonthDailyMap = lastMonthOrders.reduce<Record<string, number>>(
    (acc, order) => {
      const created = new Date(order.createdAt);
      const key = created.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + getNetRevenue(order);
      return acc;
    },
    {},
  );

  const lastMonthDaily = Object.entries(lastMonthDailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const daysInLastMonth = new Date(
    boundaries.now.getFullYear(),
    boundaries.now.getMonth(),
    0,
  ).getDate();
  const lastMonthAverage =
    daysInLastMonth > 0 ? lastMonthRevenue / daysInLastMonth : 0;

  const monthOverMonthGrowth =
    lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : null;

  return {
    lastMonthRevenue,
    lastMonthAverage,
    lastMonthDaily,
    monthOverMonthGrowth,
  };
}

function categorizePaymentMethod(
  transaction?: AnalyticsTransaction,
): "QRIS" | "Transfer" | "Tunai/Manual" {
  if (!transaction) return "Tunai/Manual";

  if (transaction.isManual || transaction.manualMethod) {
    return "Tunai/Manual";
  }

  const method = transaction.paymentMethod?.toLowerCase() ?? "";

  if (
    method.includes("qris") ||
    method.includes("gopay") ||
    method.includes("shopee") ||
    method.includes("ovo")
  ) {
    return "QRIS";
  }

  if (
    method.includes("va") ||
    method.includes("transfer") ||
    method.includes("bank")
  ) {
    return "Transfer";
  }

  return "Tunai/Manual";
}

function aggregatePaymentMethods(
  orders: AnalyticsOrder[],
  totalRevenue: number,
) {
  const aggregation = orders.reduce<
    Record<string, { method: string; amount: number; count: number }>
  >((acc, order) => {
    const methodLabel = categorizePaymentMethod(order.transaction);
    const amount = getNetRevenue(order);

    if (!acc[methodLabel]) {
      acc[methodLabel] = { method: methodLabel, amount: 0, count: 0 };
    }

    acc[methodLabel].amount += amount;
    acc[methodLabel].count += 1;

    return acc;
  }, {});

  return Object.values(aggregation)
    .map((item) => ({
      ...item,
      percentage:
        totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function resolveRevenueDateRange(
  timeframe: RevenueTimeframe,
  endInput?: string,
  startInput?: string,
) {
  const endDate = endInput ? new Date(endInput) : new Date();
  if (Number.isNaN(endDate.getTime())) {
    throw new AppError("Tanggal akhir tidak valid", HttpStatus.BAD_REQUEST);
  }

  const endBoundary = new Date(endDate);
  endBoundary.setHours(23, 59, 59, 999);

  let startBoundary: Date;

  if (timeframe === "custom") {
    if (!startInput) {
      throw new AppError(
        "Tanggal mulai diperlukan untuk rentang custom",
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsedStart = new Date(startInput);
    if (Number.isNaN(parsedStart.getTime())) {
      throw new AppError("Tanggal mulai tidak valid", HttpStatus.BAD_REQUEST);
    }
    startBoundary = parsedStart;
  } else {
    startBoundary = new Date(endBoundary);

    switch (timeframe) {
      case "7d":
        startBoundary.setDate(startBoundary.getDate() - 7);
        break;
      case "30d":
        startBoundary.setDate(startBoundary.getDate() - 30);
        break;
      case "3m":
        startBoundary.setMonth(startBoundary.getMonth() - 3);
        break;
      default:
        startBoundary.setDate(startBoundary.getDate() - 30);
    }
  }

  startBoundary.setHours(0, 0, 0, 0);

  if (startBoundary > endBoundary) {
    throw new AppError(
      "Tanggal mulai tidak boleh setelah tanggal akhir",
      HttpStatus.BAD_REQUEST,
    );
  }

  return { startBoundary, endBoundary };
}

export async function getOutletRevenueTrend(
  outletId: string,
  options?: {
    timeframe?: RevenueTimeframe;
    startDate?: string;
    endDate?: string;
  },
) {
  const timeframe = (options?.timeframe ?? "30d") as RevenueTimeframe;

  const outlet = await OutletRepository.findById(outletId);
  if (!outlet) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const { startBoundary, endBoundary } = resolveRevenueDateRange(
    timeframe,
    options?.endDate,
    options?.startDate,
  );

  const orders = await OutletRepository.getRevenueOrdersWithinRange(
    outletId,
    startBoundary,
    endBoundary,
  );
  const dailyRevenue = aggregateDailyRevenue(orders as AnalyticsOrder[]);

  const totals = dailyRevenue.reduce<{
    revenue: number;
    orders: number;
    maxRevenue: number;
  }>(
    (acc, item) => {
      acc.revenue += item.revenue;
      acc.orders += item.orders;
      acc.maxRevenue = Math.max(acc.maxRevenue, item.revenue);
      return acc;
    },
    { revenue: 0, orders: 0, maxRevenue: 0 },
  );

  const averageRevenue =
    dailyRevenue.length > 0
      ? Math.round(totals.revenue / dailyRevenue.length)
      : 0;

  return {
    timeframe,
    range: {
      startDate: startBoundary.toISOString(),
      endDate: endBoundary.toISOString(),
    },
    totals: {
      revenue: totals.revenue,
      orders: totals.orders,
      averageRevenue,
      maxRevenue: totals.maxRevenue,
    },
    data: dailyRevenue,
  };
}

export async function getOutletAnalytics(
  outletId: string,
  options?: { lowStockThreshold?: number },
) {
  const startMonth = new Date();
  const endMonth = new Date(startMonth);
  endMonth.setMonth(endMonth.getMonth() - 1);

  const lowStockThreshold = options?.lowStockThreshold ?? 10;

  const outlet = await OutletRepository.findById(outletId);

  if (!outlet)
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  const outletAnalytics = await OutletRepository.analytics(
    outletId,
    startMonth,
    endMonth,
    { lowStockThreshold },
  );

  const orders = (outletAnalytics?.revenueOrders ?? []) as AnalyticsOrder[];
  const productTypeCounts = (outletAnalytics?.productTypeCounts ??
    []) as ProductTypeCount[];
  const topProductItems = (outletAnalytics?.topProductItems ??
    []) as TopProductItem[];
  const lowStockProducts: any[] = [];
  const paymentOrders = (outletAnalytics?.paymentOrders ??
    []) as PaymentOrder[];
  const expenses = (outletAnalytics?.expenses ?? []) as AnalyticsExpense[];
  const totalRevenue = orders.reduce(
    (prev, current) => prev + getNetRevenue(current),
    0,
  );

  const boundaries = buildDateBoundaries(new Date());
  const periodSummary = summarizePeriods(orders, boundaries);
  const lastMonthSummary = summarizeLastMonth(
    orders,
    boundaries,
    periodSummary.monthRevenue,
  );
  const byPaymentMethod = aggregatePaymentMethods(orders, totalRevenue);
  const dailyRevenue = aggregateDailyRevenue(orders);
  const dailyExpenses = aggregateDailyExpenses(expenses);
  const expenseVsRevenueData = combineExpenseVsRevenue(
    dailyRevenue,
    dailyExpenses,
  );
  const orderCounts = summarizeOrderCounts(orders, boundaries);
  const orderStatuses = aggregateOrderStatuses(orders);
  const orderTrend = aggregateOrderTrend(orders);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const todayExpenses = expenses
    .filter((expense) => toDate(expense.date) >= boundaries.startOfToday)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const weekExpenses = expenses
    .filter((expense) => toDate(expense.date) >= boundaries.startOfWeek)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const monthExpenses = expenses
    .filter((expense) => toDate(expense.date) >= boundaries.startOfMonth)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const recentExpenses = expenses
    .slice()
    .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime())
    .slice(0, 5)
    .map((expense) => {
      const dateValue = toDate(expense.date);
      const formattedDate = Number.isNaN(dateValue.getTime())
        ? `${expense.date}`.slice(0, 10)
        : dateValue.toISOString().slice(0, 10);

      return {
        id: expense.id,
        description: expense.description ?? "Pengeluaran",
        amount: expense.amount,
        date: formattedDate,
      };
    });

  const expensesSummary = {
    totalExpenses,
    todayExpenses,
    weekExpenses,
    monthExpenses,
    expenseVsRevenue: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      profitMargin,
    },
    recentExpenses,
    dailyTotals: dailyExpenses,
  };

  const totalProducts = productTypeCounts.reduce(
    (sum, item) => sum + (item._count?._all ?? 0),
    0,
  );
  const byType = productTypeCounts.map((item) => ({
    type: item.type as "GOODS" | "SERVICE",
    count: item._count._all,
    percentage:
      totalProducts > 0
        ? Math.round((item._count._all / totalProducts) * 100)
        : 0,
  }));

  const topProductMap = topProductItems.reduce<
    Map<
      string,
      {
        id: string;
        name: string;
        quantity: number;
        revenue: number;
        type: "GOODS" | "SERVICE";
      }
    >
  >((acc, item) => {
    if (!item.product || item.product.status !== ServiceStatus.ACTIVE)
      return acc;

    const existing = acc.get(item.productId) ?? {
      id: item.productId,
      name: item.product.name,
      quantity: 0,
      revenue: 0,
      type: item.product.type as "GOODS" | "SERVICE",
    };

    existing.quantity += item.quantity;
    existing.revenue += item.quantity * item.priceAtTimeOfOrder;
    acc.set(item.productId, existing);
    return acc;
  }, new Map());

  const topProducts = Array.from(topProductMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const lowStock = lowStockProducts.map((product) => ({
    id: product.id,
    name: product.name,
    currentStock: product.quantity ?? 0,
    reorderLevel: lowStockThreshold,
  }));

  const revenue = {
    totalRevenue,
    ...periodSummary,
    ...lastMonthSummary,
    byPaymentMethod,
    dailyTrend: dailyRevenue,
  };

  const totalOrders = orders.length;
  const completedOrders =
    orderStatuses.find((status) => status.status === "COMPLETED")?.count ?? 0;
  const ordersSummary = {
    totalOrders,
    todayOrders: orderCounts.todayOrders,
    weekOrders: orderCounts.weekOrders,
    monthOrders: orderCounts.monthOrders,
    byStatus: orderStatuses,
    averageOrderValue:
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    completionRate:
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
    orderTrend,
  };

  const totalTransactions = paymentOrders.length;
  const statusAggregation = paymentOrders.reduce<
    Record<string, { count: number; amount: number }>
  >((acc, order) => {
    const status = order.paymentStatus ?? "UNKNOWN";
    if (!acc[status]) {
      acc[status] = { count: 0, amount: 0 };
    }

    acc[status].count += 1;
    acc[status].amount += getNetRevenue(order);
    return acc;
  }, {});

  const totalSuccess = statusAggregation["SUCCESS"]?.count ?? 0;
  const totalPending = statusAggregation["PENDING"]?.count ?? 0;
  const totalFailed =
    (statusAggregation["FAILED"]?.count ?? 0) +
    (statusAggregation["REJECTED_MANUAL"]?.count ?? 0);

  const successRate =
    totalTransactions > 0
      ? Math.round((totalSuccess / totalTransactions) * 100)
      : 0;

  const paymentMethodAggregation = paymentOrders.reduce<
    Record<string, { method: string; count: number; amount: number }>
  >((acc, order) => {
    const methodLabel = categorizePaymentMethod(order.transaction);
    if (!acc[methodLabel]) {
      acc[methodLabel] = { method: methodLabel, count: 0, amount: 0 };
    }

    acc[methodLabel].count += 1;
    acc[methodLabel].amount += getNetRevenue(order);
    return acc;
  }, {});

  const payments = {
    totalTransactions,
    successCount: totalSuccess,
    failedCount: totalFailed,
    pendingCount: totalPending,
    successRate,
    byStatus: Object.entries(statusAggregation).map(([status, value]) => ({
      status,
      count: value.count,
      amount: value.amount,
    })),
    byPaymentMethod: Object.values(paymentMethodAggregation).map((item) => ({
      ...item,
      percentage:
        totalTransactions > 0
          ? Math.round((item.count / totalTransactions) * 100)
          : 0,
    })),
    manualPayments: {
      totalManual: paymentMethodAggregation["Tunai/Manual"]?.count ?? 0,
      pending: paymentOrders.filter(
        (order) =>
          order.paymentStatus === "PENDING" &&
          (order.transaction?.isManual || order.transaction?.manualMethod),
      ).length,
      verified: paymentOrders.filter(
        (order) =>
          order.paymentStatus === "SUCCESS" &&
          (order.transaction?.isManual || order.transaction?.manualMethod),
      ).length,
      rejected: paymentOrders.filter(
        (order) =>
          order.paymentStatus === "REJECTED_MANUAL" &&
          (order.transaction?.isManual || order.transaction?.manualMethod),
      ).length,
    },
  };

  return {
    revenue,
    paymentMethods: byPaymentMethod,
    payments,
    products: {
      byType,
      topProducts,
      lowStock,
    },
    orders: ordersSummary,
    expenses: expensesSummary,
    expenseVsRevenueData,
  };
}
