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
import { ProductType, ServiceStatus } from '@prisma/client';
import { config } from "../config";

export async function createProductService(data: CreateProductInput) {
    await getOutletByIdService(data.outletId);

    const createdProduct = await ProductRepository.create(data)

    return createdProduct;
}

export async function getProductByIdService(id: string) {

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

    const result = { ...productWithoutOutlet, images };

    return result;
}

export async function getProductsByOutletIdService(
    outletId: string,
    productType: ProductType,
    params: { q?: string; accessed?: string; page: number; limit: number; }
) {
    const { q, accessed, page, limit } = params;
    const { data, total } = await ProductRepository.findByOutletId({ outletId, productType, q, accessed, page, limit });

    return {
        data,
        total
    }
}

export async function updateProductService(id: string, data: UpdateProductInput) {
    await getProductByIdService(id);
    const product = await ProductRepository.update(id, data);

    // TODO: Pertimbangkan invalidasi slot jika durasi layanan berubah

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

        const parseString = (value: any): string | undefined => {
            if (value === undefined || value === null) return undefined;
            const text = String(value).trim();
            return text.length ? text : undefined;
        };

        const commissionOptions = ['PERCENTAGE', 'FIXED'] as const;

        data.forEach((row: any, index: number) => {
            const rawType = normalizeEnum<ProductType>(row['Tipe Produk'], Object.values(ProductType));
            const rawStatus = normalizeEnum<ServiceStatus>(row['Status'], Object.values(ServiceStatus));
            const finalType = rawType ?? ProductType.GOODS;

            const productName = parseString(row['Nama Produk']);
            const imageFileName = parseString(row['Nama File Gambar']);

            const baseData = {
                name: productName,
                description: parseString(row['Deskripsi']),
                type: finalType,
                status: (rawStatus ?? ServiceStatus.ACTIVE) as ServiceStatus,
                outletId: outletId,
                image: imageFileName,
            };

            const sellingPrice = toNumber(row['Harga Jual']);

            const rowData: any = finalType === ProductType.GOODS
                ? {
                    ...baseData,
                    type: ProductType.GOODS,
                    goods: {
                        sellingPrice: sellingPrice,
                        averageHpp: toNumber(row['Harga Pokok']),
                        unit: parseString(row['Satuan']),
                        currentStock: toNumber(row['Jumlah Stok']),
                        minStock: toNumber(row['Minimal Stok']),
                    }
                }
                : {
                    ...baseData,
                    type: ProductType.SERVICE,
                    service: {
                        sellingPrice: sellingPrice,
                        durationMinutes: toNumber(row['Durasi Layanan (menit)']),
                        providerName: parseString(row['Nama Provider']) ?? productName,
                        providerPhone: parseString(row['Nomor Telepon Provider']),
                        providerEmail: parseString(row['Email Provider']),
                        commissionType: normalizeEnum<typeof commissionOptions[number]>(row['Tipe Komisi'], commissionOptions),
                        commissionValue: toNumber(row['Nilai Komisi']),
                        maxParallel: toNumber(row['Kapasitas Paralel']),
                    }
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

        const conflicts = rows.map((row) => {
            const existing = byName.get(row.name.trim().toLowerCase());
            if (existing && existing.type !== row.type) {
                return {
                    row: row._rowNumber,
                    name: row.name,
                    existingType: existing.type,
                    incomingType: row.type,
                };
            }
            return null;
        }).filter(Boolean) as Array<{ row: number; name: string; existingType: ProductType; incomingType: ProductType }>;

        if (conflicts.length > 0) {
            throw new AppError("Tipe produk tidak sesuai dengan data yang sudah ada.", HttpStatus.BAD_REQUEST, conflicts);
        }

        const outletDetail = await getOutletByIdService(outletId);
        const outletOperatingHours = outletDetail.operatingHours ?? [];

        let createdCount = 0;
        let updatedCount = 0;

        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
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
                const resolvedImageUrl = ensureImageUrl(r.image);
                const imageFromRow = typeof r.image === 'string' && r.image.trim() ? r.image.trim() : undefined;
                const productPayload = {
                    name: r.name,
                    description: r.description,
                    type: r.type,
                    status: r.status ?? ServiceStatus.ACTIVE,
                    image: resolvedImageUrl ?? imageFromRow,
                } as const;

                const goodsPayload = r.type === ProductType.GOODS ? {
                    sellingPrice: r.goods.sellingPrice,
                    averageHpp: r.goods.averageHpp,
                    unit: r.goods.unit,
                    currentStock: r.goods.currentStock ?? 0,
                    ...(r.goods.minStock !== undefined ? { minStock: r.goods.minStock } : {}),
                } : undefined;

                const servicePayload = r.type === ProductType.SERVICE ? {
                    durationMinutes: r.service.durationMinutes,
                    sellingPrice: r.service.sellingPrice,
                    providerName: r.service.providerName,
                    ...(r.service.providerPhone ? { providerPhone: r.service.providerPhone } : {}),
                    ...(r.service.providerEmail ? { providerEmail: r.service.providerEmail } : {}),
                    ...(r.service.commissionType ? { commissionType: r.service.commissionType } : {}),
                    ...(r.service.commissionValue !== undefined ? { commissionValue: r.service.commissionValue } : {}),
                    ...(r.service.maxParallel !== undefined ? { maxParallel: r.service.maxParallel } : {}),
                } : undefined;

                if (found) {
                    // Update existing product
                    await tx.product.update({
                        where: { id: found.id },
                        data: {
                            ...productPayload,
                            ...(goodsPayload ? { goods: { upsert: { update: goodsPayload, create: goodsPayload } } } : {}),
                            ...(servicePayload ? { service: { upsert: { update: servicePayload, create: servicePayload } } } : {}),
                        },
                    });

                    updatedCount += 1;
                } else {
                    // Create new product
                    const createdProduct = await tx.product.create({
                        data: {
                            ...productPayload,
                            outletId,
                            ...(goodsPayload ? { goods: { create: goodsPayload } } : {}),
                            ...(servicePayload ? { service: { create: servicePayload } } : {}),
                        },
                    });

                    // Generate booking slots for service
                    if (createdProduct.type === 'SERVICE' && r.service?.durationMinutes && outletOperatingHours.length) {
                        await generateDefaultBookingSlots({
                            productId: createdProduct.id,
                            operatingHours: outletOperatingHours,
                            serviceDurationMinutes: r.service.durationMinutes,
                            daysToGenerate: 30
                        });
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
        "Tipe Produk",
        "Status",
        "Harga Jual",
        "Harga Pokok",
        "Jumlah Stok",
        "Minimal Stok",
        "Satuan",
        "Durasi Layanan (menit)",
        "Nama Provider",
        "Nomor Telepon Provider",
        "Email Provider",
        "Tipe Komisi",
        "Nilai Komisi",
        "Kapasitas Paralel",
        "Nama File Gambar",
    ];
    const worksheet = xlsx.utils.aoa_to_sheet([headers]);

    // Data validations
    const dvList: any[] = [];
    // Tipe Produk (C)
    dvList.push({
        sqref: 'C2:C1000',
        type: 'list',
        formula1: '=_lists!$A$1:$A$2',
        showDropDown: true,
        allowBlank: false,
        errorStyle: 'stop',
        errorTitle: 'Tipe Tidak Valid',
        error: 'Silakan pilih tipe dari daftar: GOODS atau SERVICE.'
    });
    // Status (D)
    dvList.push({
        sqref: 'D2:D1000',
        type: 'list',
        formula1: '=_lists!$B$1:$B$2',
        showDropDown: true,
        allowBlank: true
    });
    // Tipe Komisi (N)
    dvList.push({
        sqref: 'N2:N1000',
        type: 'list',
        formula1: '=_lists!$C$1:$C$2',
        showDropDown: true,
        allowBlank: true
    });
    // Attach data validations
    if (!worksheet['!dataValidation']) worksheet['!dataValidation'] = [] as any[];
    worksheet['!dataValidation'].push(...dvList);


    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

    const listSheet = xlsx.utils.aoa_to_sheet([
        ["GOODS", "ACTIVE", "PERCENTAGE"],
        ["SERVICE", "INACTIVE", "FIXED"],
    ]);
    listSheet['!cols'] = [{ hidden: true }, { hidden: true }, { hidden: true }];
    xlsx.utils.book_append_sheet(workbook, listSheet, "_lists");

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
        orderBy: { createdAt: 'desc' },
        include: {
            goods: true,
            service: true,
        },
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
        "Nama Provider",
        "Tanggal Dibuat"
    ];

    const data = products.map((product, index) => {
        const goods = product.goods;
        const service = product.service;
        const hppValue = goods?.averageHpp ?? 0;
        const sellingPrice = product.type === 'GOODS'
            ? goods?.sellingPrice ?? 0
            : service?.sellingPrice ?? 0;
        const stockValue = product.type === 'GOODS'
            ? goods?.currentStock ?? 0
            : 'N/A';
        const unitValue = product.type === 'GOODS'
            ? goods?.unit ?? 'pcs'
            : 'N/A';
        const durationValue = product.type === 'SERVICE'
            ? service?.durationMinutes ?? 'N/A'
            : 'N/A';
        const capacityValue = product.type === 'SERVICE'
            ? service?.maxParallel ?? 'N/A'
            : 'N/A';
        const providerName = product.type === 'SERVICE'
            ? service?.providerName ?? 'N/A'
            : 'N/A';

        return [
            index + 1,
            product.name,
            product.description || '',
            product.type === 'GOODS' ? 'Barang' : 'Jasa',
            hppValue,
            sellingPrice,
            stockValue,
            unitValue,
            product.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif',
            durationValue,
            capacityValue,
            providerName,
            product.createdAt.toLocaleDateString('id-ID')
        ];
    });

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
        { wch: 25 },  // Nama Provider
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