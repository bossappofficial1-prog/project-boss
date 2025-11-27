import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import extract from 'extract-zip';
import { db } from "../config/prisma";
import { redis } from "../config/redis";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { ProductRepository } from "../repositories/product.repository";
import { CreateProductInput, UpdateProductInput, createProductSchema } from "../schemas/product.schema";
import { getOutletByIdService } from './outlet.service';
import { generateDefaultBookingSlots } from './booking.service';
import { BookingSlot, FeeBearer, Product, ProductType, ServiceStatus, UserRole } from '@prisma/client';
import { config } from "../config";
import { BookingRepository } from '../repositories/booking.repository';

export async function createProductService(data: CreateProductInput) {
    await getOutletByIdService(data.outletId);

    const createdProduct = await ProductRepository.create(data)

    return createdProduct;
}

export async function getProductByIdService(id: string): Promise<Product & { defaultTransactionFeeBearer: any; bookingSlots: BookingSlot[]; images?: { url: string; alt?: string }[] }> {

    const product = await ProductRepository.findById(id);
    if (!product) {
        throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const { outlet, ...productWithoutOutlet } = product

    // Use the image field from product table, not productImages table
    const images = [];
    if ((product as any).image) {
        images.push({ url: (product as any).image, alt: undefined });
    }

    const result = { ...productWithoutOutlet, defaultTransactionFeeBearer: outlet.business.defaultTransactionFeeBearer, images };

    return result;
}

export async function getProductsByOutletIdService(
    outletId: string,
    productType: ProductType,
    params: { q?: string; accessed?: string; page: number; limit: number; }
): Promise<{ data: Product[]; total: number }> {
    const { q, accessed, page, limit } = params;
    return ProductRepository.findByOutletId({ outletId, productType, q, accessed, page, limit });
}

export async function updateProductService(id: string, data: UpdateProductInput) {
    await getProductByIdService(id);
    const product = await ProductRepository.update(id, data);

    if (data.serviceDurationMinutes !== product.serviceDurationMinutes) {
        await BookingRepository.deleteByProductId(product.id)
    }

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

    // Prepare working directory
    const isZip = path.extname(file.path || '').toLowerCase() === '.zip';
    const tempRoot = path.join(process.cwd(), 'tmp', 'imports');
    if (!fs.existsSync(tempRoot)) fs.mkdirSync(tempRoot, { recursive: true });
    const workDir = isZip ? path.join(tempRoot, path.basename(file.path, '.zip') + '-' + Date.now()) : null;
    let excelPath: string | null = null;
    let imagesDir: string | null = null;

    try {
        if (isZip && file.path) {
            // Extract zip
            fs.mkdirSync(workDir!, { recursive: true });
            await extract(file.path, { dir: workDir! });

            // Find first Excel file and images directory (convention: images/)
            const walk = (dir: string): string[] =>
                fs.readdirSync(dir).flatMap(name => {
                    const p = path.join(dir, name);
                    const stat = fs.statSync(p);
                    return stat.isDirectory() ? walk(p) : [p];
                });
            const files = walk(workDir!);
            excelPath = files.find(f => ['.xlsx', '.xls', '.csv'].includes(path.extname(f).toLowerCase())) || null;
            imagesDir = fs.existsSync(path.join(workDir!, 'images')) ? path.join(workDir!, 'images') : null;
            if (!excelPath) {
                throw new AppError('Zip tidak berisi file Excel (.xlsx/.xls/.csv)', HttpStatus.BAD_REQUEST);
            }
        }

        // Read worksheet (from disk when zip, else from file buffer or path)
        let worksheet: xlsx.WorkSheet;
        if (excelPath) {
            const workbook = xlsx.readFile(excelPath);
            const sheetName = workbook.SheetNames[0];
            worksheet = workbook.Sheets[sheetName];
        } else {
            // Non-zip: use file.path or buffer
            if (file.path) {
                const workbook = xlsx.readFile(file.path);
                const sheetName = workbook.SheetNames[0];
                worksheet = workbook.Sheets[sheetName];
            } else {
                const workbook = xlsx.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                worksheet = workbook.Sheets[sheetName];
            }
        }
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
                // Temporarily store the filename; we will resolve to URL later if zip provided
                image: row['Nama File Gambar'],
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

        const uploadsDir = path.join(process.cwd(), 'uploads');
        const ensureImageUrl = (filename?: string | null): string | undefined => {
            if (!filename) return undefined;
            const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const ext = path.extname(filename).toLowerCase();
            if (!allowedExt.includes(ext)) return undefined;

            // Build candidate list of files to search when zip was provided
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

            let src: string | undefined;
            if (workDir && fs.existsSync(workDir)) {
                src = findInDir(workDir);
            }
            // If not found in zip, nothing to resolve
            if (!src) return undefined;

            const stat = fs.statSync(src);
            if (stat.size > 1 * 1024 * 1024) {
                // Skip oversized images per requirement
                return undefined;
            }
            const unique = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            const dest = path.join(uploadsDir, unique);
            fs.copyFileSync(src, dest);
            return `${config.BASE_URL}/uploads/${unique}`;
        };

        await db.$transaction(async (tx) => {
            for (const r of rows) {
                const key = r.name.trim().toLowerCase();
                const found = byName.get(key);

                // Build common data payload (exclude outletId on update)
                const resolvedImageUrl = ensureImageUrl(r.image as any);
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
                    image: resolvedImageUrl || undefined,
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
    } finally {
        // Cleanup temp dir and uploaded import file
        try {
            if (workDir && fs.existsSync(workDir)) {
                fs.rmSync(workDir, { recursive: true, force: true });
            }
        } catch { }
        try {
            if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch { }
    }
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
        "Nama File Gambar",
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

export async function exportProductsToExcelService(
    outletId: string,
    filters?: { type?: 'GOODS' | 'SERVICE'; search?: string }
): Promise<Buffer> {
    // Validate outlet exists
    await getOutletByIdService(outletId);

    // Build where clause for filtering
    const where: any = {
        outletId: outletId
    };

    if (filters?.type) {
        where.type = filters.type;
    }

    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
        ];
    }

    // Fetch products from database
    const products = await db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    // Prepare data for Excel
    const headers = [
        "No",
        "Nama Produk",
        "Deskripsi",
        "Tipe",
        "Harga Modal",
        "Harga Jual",
        "Stok",
        "Satuan",
        "Status",
        "Durasi Layanan (menit)",
        "Kapasitas Paralel",
        "Penanggung Biaya Transaksi",
        "Tanggal Dibuat"
    ];

    const data = products.map((product, index) => [
        index + 1,
        product.name,
        product.description || '',
        product.type === 'GOODS' ? 'Barang' : 'Jasa',
        (product as any).costPrice ?? 0,
        product.price,
        product.type === 'GOODS' ? ((product as any).quantity ?? 0) : 'N/A',
        product.type === 'GOODS' ? ((product as any).unit || 'pcs') : 'N/A',
        product.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif',
        (product as any).serviceDurationMinutes ?? 'N/A',
        'N/A',
        ((product as any).transactionFeeBearer === 'CUSTOMER') ? 'Pelanggan' :
            ((product as any).transactionFeeBearer === 'OWNER') ? 'Pemilik' : 'Default Bisnis',
        product.createdAt.toLocaleDateString('id-ID')
    ]);

    // Create worksheet
    const worksheet = xlsx.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    const colWidths = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama Produk
        { wch: 30 },  // Deskripsi
        { wch: 10 },  // Tipe
        { wch: 15 },  // Harga Modal
        { wch: 15 },  // Harga Jual
        { wch: 10 },  // Stok
        { wch: 10 },  // Satuan
        { wch: 12 },  // Status
        { wch: 20 },  // Durasi Layanan
        { wch: 15 },  // Kapasitas Paralel
        { wch: 15 },  // Penanggung Biaya
        { wch: 15 }   // Tanggal Dibuat
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook and add worksheet
    const workbook = xlsx.utils.book_new();
    const sheetName = filters?.type === 'GOODS' ? 'Data Produk' :
        filters?.type === 'SERVICE' ? 'Data Jasa' :
            'Data Produk & Jasa';
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return buffer;
}