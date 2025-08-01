import xlsx from 'xlsx';
import { db } from "../config/prisma";
import { redis } from "../config/redis";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { ProductRepository } from "../repositories/product.repository";
import { CreateProductInput, UpdateProductInput, createProductSchema } from "../schemas/product.schema";
import { getOutletByIdService } from './outlet.service';

export async function createProductService(data: CreateProductInput) {
    await getOutletByIdService(data.outletId)

    const product = await ProductRepository.create(data);
    return product;
}

export async function getProductByIdService(id: string) {
    const cacheKey = `product:${id}`;
    const cachedProduct = await redis.get(cacheKey);

    if (cachedProduct) {
        return JSON.parse(cachedProduct);
    }

    const product = await ProductRepository.findById(id);
    if (!product) {
        throw new AppError(Messages.NOT_FOUND, HttpStatus.NOT_FOUND);
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

    const productsToCreate: CreateProductInput[] = [];
    const errors: { row: number, errors: any }[] = [];

    data.forEach((row: any, index: number) => {
        const rowData = {
            name: row['Nama Produk'],
            description: row['Deskripsi'],
            price: row['Harga Jual'],
            costPrice: row['Harga Pokok'],
            type: row['Tipe Produk'],
            quantity: row['Jumlah Stok'],
            unit: row['Satuan'],
            outletId: outletId,
        };

        const validation = createProductSchema.safeParse(rowData);

        if (validation.success) {
            productsToCreate.push(validation.data);
        } else {
            errors.push({ row: index + 2, errors: validation.error.flatten() });
        }
    });

    if (errors.length > 0) {
        throw new AppError("Validasi gagal untuk beberapa baris.", HttpStatus.BAD_REQUEST, errors);
    }

    const createdProducts = await db.product.createMany({
        data: productsToCreate,
        skipDuplicates: true,
    });

    return createdProducts;
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
        "Satuan"
    ];
    const worksheet = xlsx.utils.aoa_to_sheet([headers]);

    // Add data validation for the "Tipe Produk" column (E)
    const dv = {
        sqref: 'E2:E1000',
        type: 'list',
        formula1: '"GOODS,SERVICE"',
        showDropDown: true,
        allowBlank: false,
        errorStyle: 'stop',
        errorTitle: 'Tipe Tidak Valid',
        error: 'Silakan pilih tipe dari daftar: GOODS atau SERVICE.'
    };
    if (!worksheet['!dataValidation']) worksheet['!dataValidation'] = [];
    worksheet['!dataValidation'].push(dv);


    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return buffer;
}