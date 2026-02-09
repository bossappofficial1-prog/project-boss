import xlsx from "xlsx";
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
import {
  Product,
  ProductType,
  ServiceStatus,
  Prisma,
} from "@prisma/client";
import { config } from "../config";
import { ImageService } from "./image.service";

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
  const createdProduct = await ProductRepository.create(data);
  await PlanLimitService.invalidateUsageCache(businessId);
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

  // Flatten images from productImages relation
  const images = productData.productImages?.map((img: any) => ({
    url: img.url,
    alt: img.alt || undefined,
  })) || [];

  // Extract booking slots if the product is a service
  const bookingSlots = productData.service?.bookingSlots || [];

  return {
    ...productData,
    images,
    bookingSlots,
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
  const product = await ProductRepository.update(id, data);

  // If service duration changed, we must clear existing generated slots as they are no longer valid
  if (data.service?.durationMinutes && product.type === "SERVICE") {
    const prevDuration = (existingProduct as any).service?.durationMinutes;
    if (prevDuration !== data.service.durationMinutes) {
      // Find the productServiceId to clear related slots
      const svc = await db.productService.findFirst({ where: { productId: id } });
      if (svc) {
        await db.bookingSlot.deleteMany({
          where: {
            productServiceId: svc.id,
            status: "AVAILABLE" // Only delete available slots to avoid breaking existing orders
          }
        });
      }
    }
  }

  try {
    if (data.image && existingProduct) {
      ImageService.deleteImageByUrl(existingProduct.image)
    }
  } catch (error) {
    console.error('Terjadi masalah saar hapus gambar, error:', error)
  }

  await redis.del(`product:${id}`);
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

  if (product && product.image) { ImageService.deleteImageByUrl(product.image) }
  await redis.del(`product:${id}`);

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
      excelPath = files.find((f) => [".xlsx", ".xls", ".csv"].includes(path.extname(f).toLowerCase())) || null;

      if (!excelPath) {
        throw new AppError("Zip does not contain a valid Excel file.", HttpStatus.BAD_REQUEST);
      }
    }

    let worksheet: xlsx.WorkSheet;
    const targetPath = excelPath || file.path;
    const workbook = targetPath ? xlsx.readFile(targetPath) : xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    worksheet = workbook.Sheets[sheetName];

    const rawData = xlsx.utils.sheet_to_json(worksheet);
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

    const parseString = (v: any) => v ? String(v).trim() : undefined;

    rawData.forEach((row: any, index: number) => {
      const type = normalizeEnum<ProductType>(row["Tipe Produk"], Object.values(ProductType)) || ProductType.GOODS;
      const status = normalizeEnum<ServiceStatus>(row["Status"], Object.values(ServiceStatus)) || ServiceStatus.ACTIVE;

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
          }
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
          }
        };
      }

      const validation = createProductSchema.safeParse(rowData);
      if (validation.success) {
        rows.push({ ...validation.data, _rowNumber: index + 2 });
      } else {
        errors.push({ row: index + 2, errors: validation.error.flatten() });
      }
    });

    if (errors.length > 0) {
      throw new AppError("Validation failed for some rows.", HttpStatus.BAD_REQUEST, errors);
    }

    const existingProducts = await db.product.findMany({
      where: { outletId },
      select: { id: true, name: true, type: true },
    });

    const byName = new Map(existingProducts.map(p => [p.name.toLowerCase(), p]));
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
              ...(r.type === "GOODS" ? { goods: { upsert: { update: r.goods!, create: r.goods! } } } : {}),
              ...(r.type === "SERVICE" ? { service: { upsert: { update: r.service!, create: r.service! } } } : {}),
            }
          });
          updatedCount++;
        } else {
          const created = await tx.product.create({
            data: {
              ...productPayload,
              outletId,
              ...(r.type === "GOODS" ? { goods: { create: r.goods! } } : {}),
              ...(r.type === "SERVICE" ? { service: { create: r.service! } } : {}),
            }
          });

          if (created.type === "SERVICE" && r.service?.durationMinutes) {
            const outlet = await tx.outlet.findUnique({ where: { id: outletId }, include: { operatingHours: true } });
            if (outlet?.operatingHours.length) {
              await generateDefaultBookingSlots({
                productId: created.id,
                operatingHours: outlet.operatingHours,
                serviceDurationMinutes: r.service.durationMinutes,
                daysToGenerate: 30
              });
            }
          }
          createdCount++;
        }
      }
    });

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
 */
export function generateProductImportTemplateService(): Buffer {
  const headers = [
    "Nama Produk", "Deskripsi", "Tipe Produk", "Status", "Harga Jual",
    "Harga Pokok", "Jumlah Stok", "Minimal Stok", "Satuan",
    "Durasi Layanan (menit)", "Nama Provider", "Nomor Telepon Provider",
    "Email Provider", "Tipe Komisi", "Nilai Komisi", "Kapasitas Paralel",
    "Nama File Gambar"
  ];

  const worksheet = xlsx.utils.aoa_to_sheet([headers]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

  // Hidden list sheet for dropdowns
  const listSheet = xlsx.utils.aoa_to_sheet([
    ["GOODS", "ACTIVE", "PERCENTAGE"],
    ["SERVICE", "INACTIVE", "FIXED"],
  ]);
  xlsx.utils.book_append_sheet(workbook, listSheet, "_lists");

  const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
  return buffer;
}

/**
 * Exports products to an Excel file.
 */
export async function exportProductsToExcelService(
  outletId: string,
  filters?: { type?: "GOODS" | "SERVICE"; search?: string },
): Promise<Buffer> {
  await getOutletByIdService(outletId);

  const where: any = { outletId };
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { goods: true, service: true },
  });

  const headers = [
    "No", "Nama Produk", "Deskripsi", "Tipe", "Harga Modal", "Harga Jual",
    "Stok", "Satuan", "Status", "Durasi Layanan (menit)", "Kapasitas Paralel",
    "Nama Provider", "Tanggal Dibuat"
  ];

  const data = products.map((p, i) => [
    i + 1,
    p.name,
    p.description || "",
    p.type === "GOODS" ? "Barang" : "Jasa",
    p.type === "GOODS" ? p.goods?.averageHpp : 0,
    p.type === "GOODS" ? p.goods?.sellingPrice : p.service?.sellingPrice,
    p.type === "GOODS" ? p.goods?.currentStock : "N/A",
    p.type === "GOODS" ? p.goods?.unit : "N/A",
    p.status === "ACTIVE" ? "Aktif" : "Non-Aktif",
    p.type === "SERVICE" ? p.service?.durationMinutes : "N/A",
    p.type === "SERVICE" ? p.service?.maxParallel : "N/A",
    p.type === "SERVICE" ? p.service?.providerName : "N/A",
    p.createdAt.toLocaleDateString("id-ID"),
  ]);

  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...data]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Data");

  return xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
}