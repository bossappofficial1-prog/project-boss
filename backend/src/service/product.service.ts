import * as ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import extract from "extract-zip";
import { db } from "../config/prisma";
import { redis } from "../config/redis";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { ProductRepository } from "../repositories/product.repository";
import {
  CreateProductInput,
  UpdateProductInput,
  createProductSchema,
} from "../schemas/product.schema";
import { getOutletByIdService } from "./outlet.service";
import { PlanLimitService } from "./plan-limit.service";
import { generateDefaultBookingSlots } from "./booking.service";
import { Product, ProductType, ServiceStatus, Prisma } from "@prisma/client";
import { config } from "../config";
import { ImageService } from "./image.service";
import { ProductMediaService, MediaItemInput } from "./product-media.service";
import { RedisUtils } from "../utils/redis.utils";

/**
 * Creates a single product and associated records.
 */
export async function createProductService(data: CreateProductInput) {
  const outlet = await getOutletByIdService(data.outletId);
  const businessId = outlet.businessId;

  if (!businessId) {
    throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await PlanLimitService.assertCanCreateProduct(businessId);
  await PlanLimitService.assertProductTypeAllowed(data.outletId, data.type);
  const createdProduct = await ProductRepository.create(data);

  // Sync media if type is SERVICE and media array provided
  if (data.type === ProductType.SERVICE && (data as any).media?.length > 0) {
    await ProductMediaService.syncMedia(createdProduct.id, (data as any).media as MediaItemInput[]);
  }

  await PlanLimitService.invalidateUsageCache(businessId);
  await RedisUtils.deleteByPattern(`pos:products:${data.outletId}:*`);
  return createdProduct;
}

/**
 * Retrieves a product by ID, transforming the response to include images and booking slots.
 */
export async function getProductByIdService(id: string) {
  const product = await ProductRepository.findById(id);
  if (!product) {
    throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const { outlet, ...productData } = product as any;

  // Map media from ProductMedia relation
  const media =
    productData.media?.map((m: any) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      source: m.source,
      alt: m.alt || undefined,
      order: m.order,
      thumbnailUrl: m.thumbnailUrl || undefined,
    })) || [];

  // Extract booking slots if the product is a service
  const bookingSlots = productData.service?.bookingSlots || [];

  return {
    ...productData,
    media,
    bookingSlots,
  };
}

export async function getProductByBarcodeService(barcode: string, outletId: string) {
  const product = await ProductRepository.findByBarcode(barcode, outletId);
  if (!product || !product.goods) {
    throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    type: product.type,
    status: product.status,
    outletId: product.outletId,
    price: product.goods.sellingPrice,
    stock: product.goods.currentStock,
    unit: product.goods.unit,
    goodsId: product.goods.id,
    barcode: product.goods.barcode,
    sku: product.goods.sku,
  };
}

/**
 * Retrieves all products for a specific outlet with filtering and pagination.
 */
export async function getProductsByOutletIdService(
  outletId: string,
  productType: ProductType,
  params: { q?: string; accessed?: string; page: number; limit: number },
): Promise<{ data: Product[]; total: number }> {
  const { q, accessed, page, limit } = params;
  return ProductRepository.findByOutletId({ outletId, productType, q, accessed, page, limit });
}

/**
 * Updates an existing product and manages side effects like slot invalidation.
 */
export async function updateProductService(id: string, data: UpdateProductInput) {
  const existingProduct = await getProductByIdService(id);
  if (data.type) {
    await PlanLimitService.assertProductTypeAllowed(existingProduct.outletId, data.type);
  }
  const product = await ProductRepository.update(id, data);

  // Sync media if type is SERVICE and media array provided
  if (product.type === "SERVICE" && (data as any).media !== undefined) {
    await ProductMediaService.syncMedia(id, ((data as any).media || []) as MediaItemInput[]);
  }

  // Check if service parameters that affect scheduling have changed
  if (product.type === "SERVICE" && data.service) {
    const s = data.service;
    const hoursChanged =
      s.durationMinutes !== undefined ||
      s.bookingInWorkHours !== undefined ||
      s.mondayOpen !== undefined ||
      s.mondayClose !== undefined ||
      s.tuesdayOpen !== undefined ||
      s.tuesdayClose !== undefined ||
      s.wednesdayOpen !== undefined ||
      s.wednesdayClose !== undefined ||
      s.thursdayOpen !== undefined ||
      s.thursdayClose !== undefined ||
      s.fridayOpen !== undefined ||
      s.fridayClose !== undefined ||
      s.saturdayOpen !== undefined ||
      s.saturdayClose !== undefined ||
      s.sundayOpen !== undefined ||
      s.sundayClose !== undefined;

    if (hoursChanged) {
      // Find the productServiceId to clear related slots
      const svc = await db.productService.findFirst({ where: { productId: id } });
      if (svc) {
        // Delete all future AVAILABLE slots so they can be regenerated with new settings
        // We keep BOOKED slots to preserve order history
        await db.bookingSlot.deleteMany({
          where: {
            productServiceId: svc.id,
            status: "AVAILABLE",
            startTime: {
              gte: new Date(), // Only delete future slots
            },
          },
        });
      }
    }
  }

  try {
    if (data.image && existingProduct) {
      ImageService.deleteImageByUrl(existingProduct.image);
    }
  } catch (error) {
    console.error("Terjadi masalah saar hapus gambar, error:", error);
  }

  await redis.del(`product:${id}`);
  if (existingProduct.outletId) {
    await RedisUtils.deleteByPattern(`pos:products:${existingProduct.outletId}:*`);
  }
  return product;
}

/**
 * Deletes a product and clears its cache.
 */
export async function deleteProductService(id: string) {
  const existingProduct = await ProductRepository.findById(id);
  if (!existingProduct) {
    throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const product = await ProductRepository.delete(id);

  try {
    if (product && product.image) {
      ImageService.deleteImageByUrl(product.image);
    }
    // Clean up media files (cascade deletes DB records but not files)
    await ProductMediaService.deleteAllMedia(id).catch(() => { });
    await redis.del(`product:${id}`);
    if (existingProduct.outletId) {
      await RedisUtils.deleteByPattern(`pos:products:${existingProduct.outletId}:*`);
    }
  } catch (error) {
    console.log(`gagal hapus gambar, error:`, error);
  }

  const businessId = existingProduct.outlet?.business?.id;
  if (businessId) {
    await PlanLimitService.invalidateUsageCache(businessId);
  }

  return product;
}

/**
 * Bulk imports products from an Excel file (optionally wrapped in a ZIP with images).
 */
export async function bulkCreateProductsFromExcelService(
  file: Express.Multer.File,
  outletId: string,
) {
  if (!file) {
    throw new AppError("File not found.", HttpStatus.BAD_REQUEST);
  }

  const isZip = path.extname(file.path || "").toLowerCase() === ".zip";
  const tempRoot = path.join(process.cwd(), "tmp", "imports");
  if (!fs.existsSync(tempRoot)) fs.mkdirSync(tempRoot, { recursive: true });

  const workDir = isZip
    ? path.join(tempRoot, path.basename(file.path, ".zip") + "-" + Date.now())
    : null;

  let excelPath: string | null = null;

  try {
    if (isZip && file.path) {
      fs.mkdirSync(workDir!, { recursive: true });
      await extract(file.path, { dir: workDir! });

      const walk = (dir: string): string[] =>
        fs.readdirSync(dir).flatMap((name) => {
          const p = path.join(dir, name);
          const stat = fs.statSync(p);
          return stat.isDirectory() ? walk(p) : [p];
        });

      const files = walk(workDir!);
      excelPath =
        files.find((f) => [".xlsx", ".xls", ".csv"].includes(path.extname(f).toLowerCase())) ||
        null;

      if (!excelPath) {
        throw new AppError("Zip does not contain a valid Excel file.", HttpStatus.BAD_REQUEST);
      }
    }

    const targetPath = excelPath || file.path;
    const wb = new ExcelJS.Workbook();
    if (targetPath) {
      await wb.xlsx.readFile(targetPath);
    } else {
      await wb.xlsx.load(file.buffer as any);
    }

    const rows: (CreateProductInput & { _rowNumber: number })[] = [];
    const errors: { row: number; errors: any }[] = [];

    const toNumber = (v: any): number | undefined => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[, ]/g, ""));
      return Number.isFinite(n) ? n : undefined;
    };

    const normalizeEnum = <T extends string>(v: any, allowed: readonly T[]): T | undefined => {
      if (!v) return undefined;
      const s = String(v).trim().toUpperCase();
      return (allowed as any).includes(s) ? (s as T) : undefined;
    };

    const parseString = (v: any) => (v ? String(v).trim() : undefined);

    const readSheetRows = (sheet: ExcelJS.Worksheet): Record<string, any>[] => {
      const result: Record<string, any>[] = [];
      const headerRow = sheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? "").trim();
      });
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 1) return;
        const obj: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) obj[headers[colNumber]] = cell.value;
        });
        obj._rowNumber = rowNumber;
        result.push(obj);
      });
      return result;
    };

    // Read "Produk Barang" sheet
    const goodsSheet = wb.getWorksheet("Produk Barang");
    if (goodsSheet) {
      readSheetRows(goodsSheet).forEach((row) => {
        const status =
          normalizeEnum<ServiceStatus>(row["Status"], Object.values(ServiceStatus)) ||
          ServiceStatus.ACTIVE;
        const rowData: any = {
          name: parseString(row["Nama Produk"]),
          description: parseString(row["Deskripsi"]),
          type: ProductType.GOODS,
          status,
          outletId,
          image: parseString(row["Nama File Gambar"]),
          goods: {
            sellingPrice: toNumber(row["Harga Jual"]) || 0,
            averageHpp: toNumber(row["Harga Pokok (HPP)"]) || 0,
            unit: parseString(row["Satuan"]) || "pcs",
            currentStock: toNumber(row["Jumlah Stok"]) || 0,
            minStock: toNumber(row["Stok Minimum"]) || 0,
          },
        };
        const validation = createProductSchema.safeParse(rowData);
        if (validation.success) {
          rows.push({ ...validation.data, _rowNumber: row._rowNumber });
        } else {
          errors.push({ row: row._rowNumber, errors: validation.error.flatten() });
        }
      });
    }

    // Read "Produk Jasa" sheet
    const serviceSheet = wb.getWorksheet("Produk Jasa");
    if (serviceSheet) {
      readSheetRows(serviceSheet).forEach((row) => {
        const status =
          normalizeEnum<ServiceStatus>(row["Status"], Object.values(ServiceStatus)) ||
          ServiceStatus.ACTIVE;
        const rowData: any = {
          name: parseString(row["Nama Layanan"]),
          description: parseString(row["Deskripsi"]),
          type: ProductType.SERVICE,
          status,
          outletId,
          image: parseString(row["Nama File Gambar"]),
          service: {
            sellingPrice: toNumber(row["Harga"]) || 0,
            durationMinutes: toNumber(row["Durasi (menit)"]) || 60,
            providerName: parseString(row["Nama Provider"]) || parseString(row["Nama Layanan"]),
            providerPhone: parseString(row["Telepon Provider"]),
            providerEmail: parseString(row["Email Provider"]),
            commissionType: normalizeEnum(row["Tipe Komisi"], ["PERCENTAGE", "FIXED"]),
            commissionValue: toNumber(row["Nilai Komisi"]),
            maxParallel: toNumber(row["Kapasitas Paralel"]) || 1,
          },
        };
        const validation = createProductSchema.safeParse(rowData);
        if (validation.success) {
          rows.push({ ...validation.data, _rowNumber: row._rowNumber });
        } else {
          errors.push({ row: row._rowNumber, errors: validation.error.flatten() });
        }
      });
    }

    // Fallback: legacy single-sheet format
    if (!goodsSheet && !serviceSheet) {
      const fallbackSheet = wb.worksheets[0];
      if (fallbackSheet) {
        readSheetRows(fallbackSheet).forEach((row) => {
          const type =
            normalizeEnum<ProductType>(row["Tipe Produk"], Object.values(ProductType)) ||
            ProductType.GOODS;
          const status =
            normalizeEnum<ServiceStatus>(row["Status"], Object.values(ServiceStatus)) ||
            ServiceStatus.ACTIVE;
          const base: any = {
            name: parseString(row["Nama Produk"]),
            description: parseString(row["Deskripsi"]),
            type,
            status,
            outletId,
            image: parseString(row["Nama File Gambar"]),
          };
          let rowData: any;
          if (type === ProductType.GOODS) {
            rowData = {
              ...base,
              goods: {
                sellingPrice: toNumber(row["Harga Jual"]) || 0,
                averageHpp: toNumber(row["Harga Pokok"]) || 0,
                unit: parseString(row["Satuan"]) || "pcs",
                currentStock: toNumber(row["Jumlah Stok"]) || 0,
                minStock: toNumber(row["Minimal Stok"]) || 0,
              },
            };
          } else {
            rowData = {
              ...base,
              service: {
                sellingPrice: toNumber(row["Harga Jual"]) || 0,
                durationMinutes: toNumber(row["Durasi Layanan (menit)"]) || 60,
                providerName: parseString(row["Nama Provider"]) || base.name,
                providerPhone: parseString(row["Nomor Telepon Provider"]),
                providerEmail: parseString(row["Email Provider"]),
                commissionType: normalizeEnum(row["Tipe Komisi"], ["PERCENTAGE", "FIXED"]),
                commissionValue: toNumber(row["Nilai Komisi"]),
                maxParallel: toNumber(row["Kapasitas Paralel"]) || 1,
              },
            };
          }
          const validation = createProductSchema.safeParse(rowData);
          if (validation.success) {
            rows.push({ ...validation.data, _rowNumber: row._rowNumber });
          } else {
            errors.push({ row: row._rowNumber, errors: validation.error.flatten() });
          }
        });
      }
    }

    if (rows.length === 0 && errors.length === 0) {
      throw new AppError("File tidak mengandung data produk.", HttpStatus.BAD_REQUEST);
    }

    if (errors.length > 0) {
      throw new AppError("Validation failed for some rows.", HttpStatus.BAD_REQUEST, errors);
    }

    const existingProducts = await db.product.findMany({
      where: { outletId },
      select: { id: true, name: true, type: true },
    });

    const byName = new Map(existingProducts.map((p) => [p.name.toLowerCase(), p]));
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Helper to resolve images from Zip
    const ensureImageUrl = (filename?: string | null): string | undefined => {
      if (!filename || !workDir) return undefined;
      const ext = path.extname(filename).toLowerCase();

      const findInDir = (dir: string): string | undefined => {
        const items = fs.readdirSync(dir);
        for (const name of items) {
          const p = path.join(dir, name);
          const stat = fs.statSync(p);
          if (stat.isDirectory()) {
            const found = findInDir(p);
            if (found) return found;
          } else if (path.basename(p).toLowerCase() === path.basename(filename).toLowerCase()) {
            return p;
          }
        }
        return undefined;
      };

      const src = findInDir(workDir);
      if (!src) return undefined;

      const unique = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const dest = path.join(uploadsDir, unique);
      fs.copyFileSync(src, dest);
      return `${config.BASE_URL}/uploads/${unique}`;
    };

    let createdCount = 0;
    let updatedCount = 0;
    const serviceProductsToGenerateSlots: { productId: string; durationMinutes: number }[] = [];

    await db.$transaction(async (tx) => {
      for (const r of rows) {
        const found = byName.get(r.name.toLowerCase());
        const resolvedImageUrl = ensureImageUrl(r.image);

        const productPayload = {
          name: r.name,
          description: r.description,
          type: r.type,
          status: r.status,
          image: resolvedImageUrl || r.image,
        };

        if (found) {
          await tx.product.update({
            where: { id: found.id },
            data: {
              ...productPayload,
              ...(r.type === "GOODS"
                ? { goods: { upsert: { update: r.goods!, create: r.goods! } } }
                : {}),
              ...(r.type === "SERVICE"
                ? { service: { upsert: { update: r.service!, create: r.service! } } }
                : {}),
            },
          });
          updatedCount++;
        } else {
          const created = await tx.product.create({
            data: {
              ...productPayload,
              outletId,
              ...(r.type === "GOODS" ? { goods: { create: r.goods! } } : {}),
              ...(r.type === "SERVICE" ? { service: { create: r.service! } } : {}),
            },
          });

          if (created.type === "SERVICE" && r.service?.durationMinutes) {
            serviceProductsToGenerateSlots.push({
              productId: created.id,
              durationMinutes: r.service.durationMinutes,
            });
          }
          createdCount++;
        }
      }
    });

    // Generate booking slots after transaction commits so data is visible
    if (serviceProductsToGenerateSlots.length > 0) {
      const outlet = await db.outlet.findUnique({
        where: { id: outletId },
        include: { operatingHours: true },
      });
      if (outlet?.operatingHours.length) {
        // Map outlet hours to service hours format
        const dayMap = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const serviceHoursFromOutlet: any = {};

        for (const oh of outlet.operatingHours) {
          if (oh.isOpen) {
            const dayName = dayMap[oh.dayOfWeek];
            serviceHoursFromOutlet[`${dayName}Open`] = oh.openTime;
            serviceHoursFromOutlet[`${dayName}Close`] = oh.closeTime;
          }
        }

        for (const sp of serviceProductsToGenerateSlots) {
          try {
            await generateDefaultBookingSlots({
              productId: sp.productId,
              serviceOperatingHours: serviceHoursFromOutlet,
              serviceDurationMinutes: sp.durationMinutes,
              daysToGenerate: 30,
            });
          } catch (e) {
            // Non-critical: log but don't fail the import
            console.error(`Failed to generate booking slots for product ${sp.productId}:`, e);
          }
        }
      }
    }

    await RedisUtils.deleteByPattern(`pos:products:${outletId}:*`);
    return { created: createdCount, updated: updatedCount, total: rows.length };
  } finally {
    if (workDir && fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
}

/**
 * Searches for products by name globally.
 */
export async function searchProductsByNameService(name: string) {
  return ProductRepository.searchByName(name);
}

/**
 * Generates an Excel template for product importing.
 * Sheet 1: "Produk Barang" — columns for GOODS products
 * Sheet 2: "Produk Jasa"  — columns for SERVICE products
 * Sheet 3: "Panduan"      — instructions for the user
 */
export async function generateProductImportTemplateService(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BOSS App";
  workbook.created = new Date();

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const cellBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const applyHeaderStyle = (sheet: ExcelJS.Worksheet) => {
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });
    sheet.getRow(1).height = 24;
  };

  // ─── Sheet: Produk Barang ───
  const gs = workbook.addWorksheet("Produk Barang");
  gs.columns = [
    { header: "Nama Produk", key: "name", width: 28 },
    { header: "Deskripsi", key: "desc", width: 25 },
    { header: "Satuan", key: "unit", width: 10 },
    { header: "Jumlah Stok", key: "stock", width: 12 },
    { header: "Stok Minimum", key: "minStock", width: 14 },
    { header: "Harga Pokok (HPP)", key: "hpp", width: 18 },
    { header: "Harga Jual", key: "price", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Nama File Gambar", key: "image", width: 20 },
  ];
  applyHeaderStyle(gs);

  // Example row
  const exGoods = gs.addRow({
    name: "Sampo Premium",
    desc: "Sampo anti rontok",
    unit: "pcs",
    stock: 50,
    minStock: 10,
    hpp: 15000,
    price: 25000,
    status: "ACTIVE",
    image: "sampo.jpg",
  });
  exGoods.eachCell((cell) => {
    cell.border = cellBorder;
    cell.font = { italic: true, color: { argb: "FF6B7280" } };
  });

  // ─── Sheet: Produk Jasa ───
  const ss = workbook.addWorksheet("Produk Jasa");
  ss.columns = [
    { header: "Nama Layanan", key: "name", width: 28 },
    { header: "Deskripsi", key: "desc", width: 25 },
    { header: "Harga", key: "price", width: 18 },
    { header: "Durasi (menit)", key: "duration", width: 14 },
    { header: "Nama Provider", key: "provider", width: 20 },
    { header: "Telepon Provider", key: "phone", width: 18 },
    { header: "Email Provider", key: "email", width: 22 },
    { header: "Tipe Komisi", key: "commType", width: 14 },
    { header: "Nilai Komisi", key: "commValue", width: 14 },
    { header: "Kapasitas Paralel", key: "parallel", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Nama File Gambar", key: "image", width: 20 },
  ];
  applyHeaderStyle(ss);

  // Example row
  const exService = ss.addRow({
    name: "Potong Rambut",
    desc: "Potong rambut pria",
    price: 50000,
    duration: 30,
    provider: "Budi",
    phone: "081234567890",
    email: "budi@mail.com",
    commType: "PERCENTAGE",
    commValue: 30,
    parallel: 1,
    status: "ACTIVE",
    image: "potong.jpg",
  });
  exService.eachCell((cell) => {
    cell.border = cellBorder;
    cell.font = { italic: true, color: { argb: "FF6B7280" } };
  });

  // ─── Sheet: Panduan ───
  const guide = workbook.addWorksheet("Panduan");
  guide.getColumn(1).width = 30;
  guide.getColumn(2).width = 50;

  const guideData = [
    ["Kolom", "Keterangan"],
    ["", ""],
    ["=== PRODUK BARANG ===", ""],
    ["Nama Produk", "Wajib. Nama produk barang."],
    ["Deskripsi", "Opsional. Deskripsi singkat."],
    ["Satuan", "Opsional. Default: pcs. Contoh: pcs, kg, liter."],
    ["Jumlah Stok", "Wajib."],
    ["Stok Minimum", "Wajib. Alert jika stok di bawah ini."],
    ["Harga Pokok (HPP)", "Wajib."],
    ["Harga Jual", "Wajib."],
    ["Status", "ACTIVE atau INACTIVE. Default: ACTIVE."],
    ["Nama File Gambar", "Opsional. Nama file gambar di dalam ZIP."],
    ["", ""],
    ["=== PRODUK JASA ===", ""],
    ["Nama Layanan", "Wajib. Nama layanan/jasa."],
    ["Deskripsi", "Opsional. Deskripsi singkat."],
    ["Harga", "Wajib."],
    ["Durasi (menit)", "Opsional. Default: 60."],
    ["Nama Provider", "Opsional. Default: nama layanan."],
    ["Telepon Provider", "Opsional."],
    ["Email Provider", "Opsional."],
    ["Tipe Komisi", "PERCENTAGE atau FIXED. Default: PERCENTAGE."],
    ["Nilai Komisi", "Wajib."],
    ["Kapasitas Paralel", "Opsional. Default: 1."],
    ["Status", "ACTIVE atau INACTIVE. Default: ACTIVE."],
    ["Nama File Gambar", "Opsional. Nama file gambar di dalam ZIP."],
  ];

  guideData.forEach((row, i) => {
    const r = guide.addRow(row);
    if (i === 0) {
      r.eachCell((cell) => {
        Object.assign(cell, { style: headerStyle });
      });
      r.height = 24;
    } else if (String(row[0]).startsWith("===")) {
      r.getCell(1).font = { bold: true, size: 11 };
    }
  });

  return workbook;
}

/**
 * Exports products to an Excel file.
 * - Sheet "Produk Barang": all GOODS products
 * - Sheet "Produk Jasa": all SERVICE products
 * Each sheet has columns specific to its type.
 */
export async function exportProductsToExcelService(
  outletId: string,
  filters?: { type?: "GOODS" | "SERVICE"; search?: string },
) {
  await getOutletByIdService(outletId);

  const products = await ProductRepository.findForExport(outletId, filters);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BOSS App";
  workbook.created = new Date();

  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF2563EB" } },
    alignment: { vertical: "middle" as const, horizontal: "center" as const, wrapText: true },
    border: {
      top: { style: "thin" as const },
      left: { style: "thin" as const },
      bottom: { style: "thin" as const },
      right: { style: "thin" as const },
    },
  };

  const cellBorder = {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  const applyHeaderStyle = (sheet: ExcelJS.Worksheet) => {
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });
    sheet.getRow(1).height = 24;
  };

  const applyRowBorder = (row: ExcelJS.Row) => {
    row.eachCell((cell) => {
      cell.border = cellBorder;
    });
  };

  const formatCurrencyCells = (row: ExcelJS.Row, sheet: ExcelJS.Worksheet, keys: string[]) => {
    keys.forEach((key) => {
      const col = sheet.getColumn(key);
      const cell = row.getCell(col.number);
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0";
      }
    });
  };

  const goodsProducts = products.filter((p) => p.type === "GOODS");
  const serviceProducts = products.filter((p) => p.type === "SERVICE");

  // ─── Sheet: Produk Barang ───
  if (!filters?.type || filters.type === "GOODS") {
    const gs = workbook.addWorksheet("Produk Barang");
    gs.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Produk", key: "name", width: 28 },
      { header: "Deskripsi", key: "desc", width: 25 },
      { header: "Satuan", key: "unit", width: 10 },
      { header: "Stok", key: "stock", width: 10 },
      { header: "Stok Minimum", key: "minStock", width: 14 },
      { header: "HPP Rata-rata", key: "hpp", width: 18 },
      { header: "Harga Jual", key: "price", width: 18 },
      { header: "Margin (%)", key: "margin", width: 12 },
      { header: "Nilai Stok", key: "stockValue", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Dibuat", key: "createdAt", width: 16 },
    ];
    applyHeaderStyle(gs);

    goodsProducts.forEach((p, i) => {
      const g = p.goods!;
      const margin =
        g.sellingPrice > 0 ? ((g.sellingPrice - g.averageHpp) / g.sellingPrice) * 100 : 0;

      const row = gs.addRow({
        no: i + 1,
        name: p.name,
        desc: p.description || "-",
        unit: g.unit,
        stock: g.currentStock,
        minStock: g.minStock ?? "-",
        hpp: g.averageHpp,
        price: g.sellingPrice,
        margin: Math.round(margin * 10) / 10,
        stockValue: g.currentStock * g.averageHpp,
        status: p.status === "ACTIVE" ? "Aktif" : "Non-Aktif",
        createdAt: p.createdAt.toLocaleDateString("id-ID"),
      });

      applyRowBorder(row);
      formatCurrencyCells(row, gs, ["hpp", "price", "stockValue"]);

      // Status color
      const statusCell = row.getCell(gs.getColumn("status").number);
      statusCell.font =
        p.status === "ACTIVE" ? { color: { argb: "FF16A34A" } } : { color: { argb: "FFDC2626" } };

      // Low stock warning
      if (g.currentStock === 0) {
        row.getCell(gs.getColumn("stock").number).font = {
          color: { argb: "FFDC2626" },
          bold: true,
        };
      } else if (g.minStock !== null && g.currentStock <= g.minStock) {
        row.getCell(gs.getColumn("stock").number).font = {
          color: { argb: "FFF59E0B" },
          bold: true,
        };
      }

      // Margin percentage format
      const marginCell = row.getCell(gs.getColumn("margin").number);
      if (typeof marginCell.value === "number") {
        marginCell.numFmt = '0.0"%"';
      }
    });

    // Totals row
    if (goodsProducts.length > 0) {
      const totalRow = gs.addRow({
        no: "",
        name: "TOTAL",
        desc: "",
        unit: "",
        stock: goodsProducts.reduce((s, p) => s + (p.goods?.currentStock ?? 0), 0),
        minStock: "",
        hpp: "",
        price: "",
        margin: "",
        stockValue: goodsProducts.reduce(
          (s, p) => s + (p.goods ? p.goods.currentStock * p.goods.averageHpp : 0),
          0,
        ),
        status: "",
        createdAt: "",
      });
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = cellBorder;
      });
      formatCurrencyCells(totalRow, gs, ["stockValue"]);
    }
  }

  // ─── Sheet: Produk Jasa ───
  if (!filters?.type || filters.type === "SERVICE") {
    const ss = workbook.addWorksheet("Produk Jasa");
    ss.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Layanan", key: "name", width: 28 },
      { header: "Deskripsi", key: "desc", width: 25 },
      { header: "Harga", key: "price", width: 18 },
      { header: "Durasi (menit)", key: "duration", width: 14 },
      { header: "Provider", key: "provider", width: 20 },
      { header: "Telepon Provider", key: "phone", width: 18 },
      { header: "Email Provider", key: "email", width: 22 },
      { header: "Tipe Komisi", key: "commType", width: 14 },
      { header: "Nilai Komisi", key: "commValue", width: 14 },
      { header: "Kapasitas Paralel", key: "parallel", width: 16 },
      { header: "Status", key: "status", width: 12 },
      { header: "Dibuat", key: "createdAt", width: 16 },
    ];
    applyHeaderStyle(ss);

    serviceProducts.forEach((p, i) => {
      const sv = p.service!;
      const commLabel = sv.commissionType === "PERCENTAGE" ? "Persentase" : "Nominal";

      const row = ss.addRow({
        no: i + 1,
        name: p.name,
        desc: p.description || "-",
        price: sv.sellingPrice,
        duration: sv.durationMinutes,
        provider: sv.providerName,
        phone: sv.providerPhone || "-",
        email: sv.providerEmail || "-",
        commType: commLabel,
        commValue:
          sv.commissionType === "PERCENTAGE" ? `${sv.commissionValue}%` : sv.commissionValue,
        parallel: sv.maxParallel,
        status: p.status === "ACTIVE" ? "Aktif" : "Non-Aktif",
        createdAt: p.createdAt.toLocaleDateString("id-ID"),
      });

      applyRowBorder(row);
      formatCurrencyCells(row, ss, ["price"]);

      // Komisi nominal format
      const commCell = row.getCell(ss.getColumn("commValue").number);
      if (typeof commCell.value === "number") {
        commCell.numFmt = "#,##0";
      }

      // Status color
      const statusCell = row.getCell(ss.getColumn("status").number);
      statusCell.font =
        p.status === "ACTIVE" ? { color: { argb: "FF16A34A" } } : { color: { argb: "FFDC2626" } };
    });
  }

  return workbook;
}
