import { StockMovementType } from "@prisma/client";
import { db } from "../config/prisma";
import { StockLogRepository } from "../repositories/stock-log.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import * as ExcelJS from "exceljs";
import {
  StockInInput,
  StockOutInput,
  StockAdjustmentInput,
  StockReturnInput,
} from "../schemas/stock.schema";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

/**
 * Record incoming stock (purchase/restock)
 * - Creates stock log with type IN
 * - Updates ProductGoods currentStock
 * - Recalculates average HPP
 */
export async function recordStockIn(data: StockInInput) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.IN,
        quantity: data.quantity,
        hppPerUnit: data.hppPerUnit,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        faktur: data.faktur,
      },
    });

    // Update current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: {
          increment: data.quantity,
        },
      },
    });

    // Recalculate average HPP
    const newAverageHpp = await StockLogRepository.calculateAverageHpp(data.productGoodsId);
    await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        averageHpp: newAverageHpp,
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
      newAverageHpp,
    };
  });
}

/**
 * Record multiple incoming stock in a single transaction
 */
export async function recordStockInBulk(data: StockInInput[]) {
  if (data.length === 0) {
    return [];
  }

  // Use a transaction to ensure all stock movements succeed or fail together
  return db.$transaction(
    async (tx) => {
      const results = [];

      for (const item of data) {
        // Verify ProductGoods exists
        const productGoods = await tx.productGoods.findUnique({
          where: { id: item.productGoodsId },
        });

        if (!productGoods) {
          throw new AppError(
            `Product Goods dengan ID ${item.productGoodsId} tidak ditemukan`,
            HttpStatus.NOT_FOUND,
          );
        }

        // Create stock log
        const stockLog = await tx.stockLog.create({
          data: {
            productGoodsId: item.productGoodsId,
            type: StockMovementType.IN,
            quantity: item.quantity,
            hppPerUnit: item.hppPerUnit,
            referenceType: item.referenceType,
            referenceId: item.referenceId,
            notes: item.notes,
            faktur: item.faktur,
          },
        });

        // Update current stock
        const updatedGoods = await tx.productGoods.update({
          where: { id: item.productGoodsId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });

        // Recalculate average HPP
        // Note: We need to use StockLogRepository logic but adapted for transaction context
        // OR we can rely on eventual consistency if heavy, but here we want immediate correct HPP.
        // Since StockLogRepository might use 'db' instance directly, we should ideally duplicate the logic
        // or ensure repository accepts transaction client.
        // For simplicity and correctness in this codebase, let's recalculate manually within TX or assume
        // StockLogRepository uses global db but we just wrote to it in TX... actually if we use global db
        // inside TX for reading logs it might not see the new log yet if isolation level is high,
        // but Prisma usually handles this if we pass tx.
        // Let's reimplement simple Weighted Average logic here using tx to be safe.

        // Get all IN logs (including this new one) to calculate weighted average
        const allInLogs = await tx.stockLog.findMany({
          where: {
            productGoodsId: item.productGoodsId,
            type: "IN",
          },
        });

        let totalValue = 0;
        let totalQty = 0;

        for (const log of allInLogs) {
          const qty = log.quantity;
          const price = log.hppPerUnit || 0;
          totalValue += qty * price;
          totalQty += qty;
        }

        const newAverageHpp = totalQty > 0 ? totalValue / totalQty : 0;

        await tx.productGoods.update({
          where: { id: item.productGoodsId },
          data: {
            averageHpp: newAverageHpp,
          },
        });

        results.push({
          stockLog,
          productGoods: updatedGoods,
          newAverageHpp,
        });
      }

      return results;
    },
    {
      timeout: 20000, // Increase timeout for bulk operations
    },
  );
}

/**
 * Record outgoing stock (manual sale/usage)
 * Note: For order-based stock out, see order service integration
 * - Creates stock log with type OUT
 * - Decreases ProductGoods currentStock
 */
export async function recordStockOut(data: StockOutInput) {
  // Verify ProductGoods exists and has sufficient stock
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  if (productGoods.currentStock < data.quantity) {
    throw new AppError(
      `Stok tidak mencukupi. Stok saat ini: ${productGoods.currentStock}, diminta: ${data.quantity}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.OUT,
        quantity: data.quantity,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
      },
    });

    // Decrease current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: {
          decrement: data.quantity,
        },
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
    };
  });
}

/**
 * Manual stock adjustment (positive or negative)
 * - Creates stock log with type ADJUSTMENT
 * - Adjusts ProductGoods currentStock
 */
export async function adjustStock(data: StockAdjustmentInput) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const newStock = productGoods.currentStock + data.quantity;
  if (newStock < 0) {
    throw new AppError(
      `Adjustment menghasilkan stok negatif. Stok saat ini: ${productGoods.currentStock}, adjustment: ${data.quantity}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.ADJUSTMENT,
        quantity: data.quantity,
        notes: data.notes,
      },
    });

    // Adjust current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: newStock,
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
    };
  });
}

/**
 * Record stock return (customer return/defective goods return)
 * - Creates stock log with type RETURN
 * - Increases ProductGoods currentStock
 */
export async function recordReturn(data: StockReturnInput) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: data.productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  return db.$transaction(async (tx) => {
    // Create stock log
    const stockLog = await tx.stockLog.create({
      data: {
        productGoodsId: data.productGoodsId,
        type: StockMovementType.RETURN,
        quantity: data.quantity,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        faktur: data.faktur,
      },
    });

    // Increase current stock
    const updatedGoods = await tx.productGoods.update({
      where: { id: data.productGoodsId },
      data: {
        currentStock: {
          increment: data.quantity,
        },
      },
    });

    return {
      stockLog,
      productGoods: updatedGoods,
    };
  });
}

/**
 * Record multiple supplier returns in a single transaction (stock OUT)
 * This is used for returning goods to supplier, which decreases stock
 */
export async function recordReturnBulk(data: StockReturnInput[]) {
  if (data.length === 0) {
    return [];
  }

  return db.$transaction(
    async (tx) => {
      const results = [];

      for (const item of data) {
        // Verify ProductGoods exists
        const productGoods = await tx.productGoods.findUnique({
          where: { id: item.productGoodsId },
        });

        if (!productGoods) {
          throw new AppError(
            `Product Goods dengan ID ${item.productGoodsId} tidak ditemukan`,
            HttpStatus.NOT_FOUND,
          );
        }

        // Check sufficient stock
        if (productGoods.currentStock < item.quantity) {
          throw new AppError(
            `Stok tidak mencukupi untuk pengembalian. Stok saat ini: ${productGoods.currentStock}, diminta: ${item.quantity}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        // Create stock log with type OUT (returning to supplier means stock goes out)
        const stockLog = await tx.stockLog.create({
          data: {
            productGoodsId: item.productGoodsId,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            referenceType: item.referenceType || "RETURN",
            referenceId: item.referenceId,
            notes: item.notes,
            faktur: item.faktur,
          },
        });

        // Decrease current stock
        const updatedGoods = await tx.productGoods.update({
          where: { id: item.productGoodsId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        results.push({
          stockLog,
          productGoods: updatedGoods,
        });
      }

      return results;
    },
    {
      timeout: 20000,
    },
  );
}

/**
 * Get stock movement history for a product
 */
export async function getStockHistory(
  productGoodsId: string,
  filters?: {
    type?: StockMovementType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  },
) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const logs = await StockLogRepository.findByProductGoodsId(productGoodsId, filters);

  return {
    productGoods,
    logs,
    total: logs.length,
  };
}

/**
 * Get products with low stock (currentStock <= minStock)
 */
export async function getLowStockProducts(outletId: string) {
  const products = await db.product.findMany({
    where: {
      outletId,
      type: "GOODS",
      goods: {
        OR: [
          {
            // When minStock is set and currentStock <= minStock
            AND: [
              { minStock: { not: null } },
              { currentStock: { lte: db.productGoods.fields.minStock } },
            ],
          },
        ],
      },
    },
    include: {
      goods: true,
    },
  });

  // Filter in application layer for safety (complex Prisma query might fail)
  const lowStockProducts = products.filter((product) => {
    if (!product.goods) return false;
    if (product.goods.minStock === null) return false;
    return product.goods.currentStock <= product.goods.minStock;
  });

  return lowStockProducts;
}

/**
 * Manually recalculate HPP for a product goods
 * Useful for data corrections or audits
 */
export async function recalculateHpp(productGoodsId: string) {
  // Verify ProductGoods exists
  const productGoods = await db.productGoods.findUnique({
    where: { id: productGoodsId },
    include: { product: true },
  });

  if (!productGoods) {
    throw new AppError("Product Goods tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const newAverageHpp = await StockLogRepository.calculateAverageHpp(productGoodsId);

  const updated = await db.productGoods.update({
    where: { id: productGoodsId },
    data: {
      averageHpp: newAverageHpp,
    },
  });

  return {
    productGoods: updated,
    previousHpp: productGoods.averageHpp,
    newHpp: newAverageHpp,
  };
}

/**
 * Get stock overview for an outlet
 * Returns summary stats: total products, stock value, low/out-of-stock, recent movements
 */
export async function getStockOverview(outletId: string) {
  const outlet = await db.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) {
    throw new AppError("Outlet tidak ditemukan", HttpStatus.NOT_FOUND);
  }
  return StockLogRepository.getOutletOverview(outletId);
}

/**
 * Export stock data to Excel workbook
 * Sheet 1: Ringkasan (summary of all products)
 * Sheet 2+: Per-product stock movement history
 */
export async function exportStockToExcel(outletId: string) {
  const outlet = await OutletRepository.findById(outletId);
  if (!outlet) {
    throw new AppError("Outlet tidak ditemukan", HttpStatus.NOT_FOUND);
  }

  const products = await StockLogRepository.getExportData(outletId);

  if (products.length === 0) {
    throw new AppError("Tidak ada produk barang untuk diexport", HttpStatus.BAD_REQUEST);
  }

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

  // ─── Sheet 1: Ringkasan ───
  const summary = workbook.addWorksheet("Ringkasan");
  summary.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Produk", key: "name", width: 30 },
    { header: "Stok Saat Ini", key: "currentStock", width: 15 },
    { header: "Stok Minimum", key: "minStock", width: 15 },
    { header: "Satuan", key: "unit", width: 12 },
    { header: "HPP Rata-rata", key: "averageHpp", width: 20 },
    { header: "Harga Jual", key: "sellingPrice", width: 20 },
    { header: "Nilai Stok", key: "stockValue", width: 22 },
    { header: "Margin (%)", key: "margin", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];

  // Apply header style
  summary.getRow(1).eachCell((cell) => {
    Object.assign(cell, { style: headerStyle });
  });

  products.forEach((product, index) => {
    const goods = product.goods!;
    const stockValue = goods.currentStock * goods.averageHpp;
    const margin =
      goods.sellingPrice > 0
        ? (((goods.sellingPrice - goods.averageHpp) / goods.sellingPrice) * 100).toFixed(1)
        : "0";

    let status = "Tersedia";
    if (goods.currentStock === 0) {
      status = "Habis";
    } else if (goods.minStock !== null && goods.currentStock <= goods.minStock) {
      status = "Stok Rendah";
    }

    const row = summary.addRow({
      no: index + 1,
      name: product.name,
      currentStock: goods.currentStock,
      minStock: goods.minStock ?? "-",
      unit: goods.unit,
      averageHpp: goods.averageHpp,
      sellingPrice: goods.sellingPrice,
      stockValue,
      margin: `${margin}%`,
      status,
    });

    row.eachCell((cell) => {
      cell.border = cellBorder;
    });

    // Format currency columns
    ["averageHpp", "sellingPrice", "stockValue"].forEach((key) => {
      const col = summary.getColumn(key);
      const cellRef = row.getCell(col.number);
      cellRef.numFmt = '#,##0';
    });

    // Color status
    const statusCell = row.getCell(summary.getColumn("status").number);
    if (status === "Habis") {
      statusCell.font = { color: { argb: "FFDC2626" }, bold: true };
    } else if (status === "Stok Rendah") {
      statusCell.font = { color: { argb: "FFF59E0B" }, bold: true };
    } else {
      statusCell.font = { color: { argb: "FF16A34A" } };
    }
  });

  // Totals row
  const totalRow = summary.addRow({
    no: "",
    name: "TOTAL",
    currentStock: products.reduce((sum, p) => sum + (p.goods?.currentStock ?? 0), 0),
    minStock: "",
    unit: "",
    averageHpp: "",
    sellingPrice: "",
    stockValue: products.reduce(
      (sum, p) => sum + (p.goods ? p.goods.currentStock * p.goods.averageHpp : 0),
      0,
    ),
    margin: "",
    status: "",
  });
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.border = cellBorder;
  });
  totalRow.getCell(summary.getColumn("stockValue").number).numFmt = '#,##0';

  // ─── Sheet 2+: Per-product history ───
  const typeLabels: Record<string, string> = {
    IN: "Masuk",
    OUT: "Keluar",
    ADJUSTMENT: "Penyesuaian",
    RETURN: "Retur",
  };

  for (const product of products) {
    const goods = product.goods!;
    const logs = goods.stockLogs || [];

    // Sheet name max 31 chars
    const sheetName = product.name.length > 28
      ? product.name.substring(0, 28) + "..."
      : product.name;

    const sheet = workbook.addWorksheet(sheetName);

    // Product info header
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = product.name;
    titleCell.font = { bold: true, size: 14 };

    sheet.mergeCells("A2:G2");
    sheet.getCell("A2").value =
      `Stok: ${goods.currentStock} ${goods.unit} | HPP Rata-rata: Rp ${goods.averageHpp.toLocaleString("id-ID")} | Harga Jual: Rp ${goods.sellingPrice.toLocaleString("id-ID")}`;
    sheet.getCell("A2").font = { size: 10, color: { argb: "FF666666" } };

    // Empty row
    sheet.addRow([]);

    // History table header
    const historyHeaderRow = sheet.addRow([
      "No",
      "Tanggal",
      "Tipe",
      "Jumlah",
      "HPP/Unit",
      "Referensi",
      "Catatan",
    ]);
    historyHeaderRow.eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });

    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 18;
    sheet.getColumn(6).width = 20;
    sheet.getColumn(7).width = 30;

    if (logs.length === 0) {
      const emptyRow = sheet.addRow(["", "Belum ada riwayat stok", "", "", "", "", ""]);
      emptyRow.getCell(2).font = { italic: true, color: { argb: "FF999999" } };
    } else {
      logs.forEach((log, idx) => {
        const row = sheet.addRow([
          idx + 1,
          new Date(log.createdAt).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          typeLabels[log.type] || log.type,
          log.quantity,
          log.hppPerUnit ?? "-",
          log.referenceType
            ? `${log.referenceType}${log.referenceId ? ` #${log.referenceId.substring(0, 8)}` : ""}`
            : "-",
          log.notes || "-",
        ]);

        row.eachCell((cell) => {
          cell.border = cellBorder;
        });

        // Format HPP column
        if (log.hppPerUnit !== null) {
          row.getCell(5).numFmt = '#,##0';
        }

        // Color type
        const typeCell = row.getCell(3);
        if (log.type === "IN") {
          typeCell.font = { color: { argb: "FF16A34A" } };
        } else if (log.type === "OUT") {
          typeCell.font = { color: { argb: "FFDC2626" } };
        } else if (log.type === "RETURN") {
          typeCell.font = { color: { argb: "FFF59E0B" } };
        }
      });
    }
  }

  return workbook;
}
