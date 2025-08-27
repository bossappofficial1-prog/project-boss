import xlsx from 'xlsx';
import { db } from "../config/prisma";
import { redis } from "../config/redis";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { ProductRepository } from "../repositories/product.repository";
import { CreateProductInput, UpdateProductInput, createProductSchema } from "../schemas/product.schema";
import { getOutletByIdService } from './outlet.service';
import { generateDefaultBookingSlots } from './booking.service';
import { BookingSlot, FeeBearer, Product, ProductType, ServiceStatus } from '@prisma/client';

export async function createProductService(data: CreateProductInput) {
    await getOutletByIdService(data.outletId);

    // Buat produk
    const product = await db.$transaction(async (prisma) => {
        const { capacity: capacityRequested, ...dataWithoutCapacity } = data as any;
        const createdProduct = await prisma.product.create({
            data: {
                ...dataWithoutCapacity,
                // Jika tipe SERVICE, buat capacity default atau sesuai input
                ...(data.type === 'SERVICE' && data.serviceDurationMinutes && {
                    capacity: {
                        create: {
                            maxParallel: capacityRequested && capacityRequested > 0 ? capacityRequested : 1
                        }
                    }
                })
            },
            include: {
                capacity: true
            }
        });

        // Jika service, generate slot untuk 30 hari ke depan
        if (data.type === 'SERVICE' && data.serviceDurationMinutes) {
            const outlet = await prisma.outlet.findUnique({
                where: { id: data.outletId },
                include: { operatingHours: true }
            });

            if (outlet?.operatingHours) {
                await generateDefaultBookingSlots({
                    productId: createdProduct.id,
                    operatingHours: outlet.operatingHours,
                    serviceDurationMinutes: data.serviceDurationMinutes,
                    daysToGenerate: 30
                });
            }
        }

        return createdProduct;
    });

    return product;
}

export async function getProductByIdService(id: string): Promise<Product & { defaultTransactionFeeBearer: any; bookingSlots: BookingSlot[] }> {
    const cacheKey = `product:${id}`;
    const cachedProduct = await redis.get(cacheKey);

    if (cachedProduct) {
        return JSON.parse(cachedProduct);
    }

    const product = await ProductRepository.findById(id);
    if (!product) {
        throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);
    const { outlet, ...productWithoutOutlet } = product

    return { ...productWithoutOutlet, defaultTransactionFeeBearer: outlet.business.defaultTransactionFeeBearer };
}

export async function getProductsByOutletIdService(outletId: string, q?: string) {
    const products = await ProductRepository.findByOutletId(outletId, q);
    return products;
}

export async function updateProductService(id: string, data: UpdateProductInput) {
    await getProductByIdService(id);
    const product = await ProductRepository.update(id, data);
    await redis.del(`product:${id}`);
    return product;
}

export async function deleteProductService(id: string) {
    await getProductByIdService(id);
    const product = await ProductRepository.delete(id);
    await redis.del(`product:${id}`);
    return product;
}

export async function bulkCreateProductsFromExcelService(file: Express.Multer.File, outletId: string) {
    if (!file) {
        throw new AppError("File tidak ditemukan.", HttpStatus.BAD_REQUEST);
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    type ParsedRow = CreateProductInput & { _rowNumber: number };
    const rows: ParsedRow[] = [];
    const errors: { row: number, errors: any }[] = [];

    const toNumber = (v: any): number | undefined => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
        return Number.isFinite(n) ? n : undefined;
    };

    const normalizeEnum = <T extends string>(v: any, allowed: readonly T[]): T | undefined => {
        if (v === undefined || v === null || v === '') return undefined;
        const s = String(v).trim().toUpperCase();
        // @ts-ignore
        return allowed.includes(s) ? (s as T) : undefined;
    };

    data.forEach((row: any, index: number) => {
        const rawType = normalizeEnum<ProductType>(row['Tipe Produk'], Object.values(ProductType));
        const rawStatus = normalizeEnum<ServiceStatus>(row['Status'], Object.values(ServiceStatus));
        const rawFeeBearer = normalizeEnum<FeeBearer>(row['Penanggung Biaya'], Object.values(FeeBearer));

        const rowData: CreateProductInput = {
            name: row['Nama Produk'],
            description: row['Deskripsi'],
            price: toNumber(row['Harga Jual']) as number,
            costPrice: toNumber(row['Harga Pokok']) ?? 0,
            type: (rawType ?? ProductType.GOODS) as ProductType,
            quantity: toNumber(row['Jumlah Stok']) as number | undefined,
            unit: row['Satuan'],
            status: (rawStatus ?? ServiceStatus.ACTIVE) as ServiceStatus,
            transactionFeeBearer: rawFeeBearer as FeeBearer | undefined,
            serviceDurationMinutes: toNumber(row['Durasi Layanan (menit)']) as number | undefined,
            outletId: outletId,
            image: row['URL Gambar'],
            // capacity is optional, not exposed directly in template. Could map from 'Kapasitas Paralel'
            capacity: toNumber(row['Kapasitas Paralel']) as number | undefined,
        };

        const validation = createProductSchema.safeParse(rowData);
        if (validation.success) {
            rows.push({ ...validation.data, _rowNumber: index + 2 });
        } else {
            errors.push({ row: index + 2, errors: validation.error.flatten() });
        }
    });

    if (errors.length > 0) {
        throw new AppError("Validasi gagal untuk beberapa baris.", HttpStatus.BAD_REQUEST, errors);
    }

    // Ambil semua produk existing untuk outlet ini untuk upsert by name (case-insensitive)
    const existingProducts = await db.product.findMany({
        where: { outletId },
        select: { id: true, name: true, type: true }
    });
    const byName = new Map<string, { id: string; name: string; type: ProductType }>();
    existingProducts.forEach(p => byName.set(p.name.trim().toLowerCase(), p));

    let createdCount = 0;
    let updatedCount = 0;

    await db.$transaction(async (tx) => {
        for (const r of rows) {
            const key = r.name.trim().toLowerCase();
            const found = byName.get(key);

            // Build common data payload (exclude outletId on update)
            const commonData = {
                name: r.name,
                description: r.description,
                price: r.price,
                costPrice: r.costPrice ?? 0,
                type: r.type,
                quantity: r.type === 'GOODS' ? (r.quantity ?? 0) : null,
                unit: r.unit,
                status: r.status ?? ServiceStatus.ACTIVE,
                transactionFeeBearer: r.transactionFeeBearer ?? null,
                serviceDurationMinutes: r.type === 'SERVICE' ? (r.serviceDurationMinutes ?? 0) : null,
                image: r.image,
            } as const;

            if (found) {
                // Update existing product
                await tx.product.update({
                    where: { id: found.id },
                    data: {
                        ...commonData,
                        // Capacity adjustments for SERVICE
                        ...(r.type === 'SERVICE' && {
                            capacity: r.capacity && r.capacity > 0
                                ? {
                                    upsert: {
                                        update: { maxParallel: r.capacity },
                                        create: { maxParallel: r.capacity }
                                    }
                                }
                                : undefined
                        }),
                    },
                });

                updatedCount += 1;
            } else {
                // Create new product
                const createdProduct = await tx.product.create({
                    data: {
                        ...commonData,
                        outletId,
                        ...(r.type === 'SERVICE' && {
                            capacity: {
                                create: { maxParallel: r.capacity && r.capacity > 0 ? r.capacity : 1 }
                            }
                        })
                    },
                    include: { capacity: true }
                });

                // Generate booking slots for service
                if (createdProduct.type === 'SERVICE' && createdProduct.serviceDurationMinutes) {
                    const outlet = await tx.outlet.findUnique({
                        where: { id: outletId },
                        include: { operatingHours: true }
                    });
                    if (outlet?.operatingHours?.length) {
                        await generateDefaultBookingSlots({
                            productId: createdProduct.id,
                            operatingHours: outlet.operatingHours,
                            serviceDurationMinutes: createdProduct.serviceDurationMinutes,
                            daysToGenerate: 30
                        });
                    }
                }

                createdCount += 1;
            }
        }
    });

    return { created: createdCount, updated: updatedCount, total: rows.length };
}

export async function searchProductsByNameService(name: string) {
    const products = await ProductRepository.searchByName(name);
    return products;
}

export function generateProductImportTemplateService(): Buffer {
    const headers = [
        "Nama Produk",
        "Deskripsi",
        "Harga Jual",
        "Harga Pokok",
        "Tipe Produk",
        "Jumlah Stok",
        "Satuan",
        "Status",
        "Penanggung Biaya",
        "Durasi Layanan (menit)",
        "URL Gambar",
        "Kapasitas Paralel"
    ];
    const worksheet = xlsx.utils.aoa_to_sheet([headers]);

    // Data validations
    const dvList: any[] = [];
    // Tipe Produk (E)
    dvList.push({
        sqref: 'E2:E1000',
        type: 'list',
        formula1: '"GOODS,SERVICE"',
        showDropDown: true,
        allowBlank: false,
        errorStyle: 'stop',
        errorTitle: 'Tipe Tidak Valid',
        error: 'Silakan pilih tipe dari daftar: GOODS atau SERVICE.'
    });
    // Status (H)
    dvList.push({
        sqref: 'H2:H1000',
        type: 'list',
        formula1: '"ACTIVE,INACTIVE"',
        showDropDown: true,
        allowBlank: true
    });
    // Penanggung Biaya (I)
    dvList.push({
        sqref: 'I2:I1000',
        type: 'list',
        formula1: '"CUSTOMER,OWNER"',
        showDropDown: true,
        allowBlank: true
    });
    // Attach data validations
    if (!worksheet['!dataValidation']) worksheet['!dataValidation'] = [] as any[];
    worksheet['!dataValidation'].push(...dvList);


    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return buffer;
}