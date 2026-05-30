import { BaseService } from "./base.service";
import { StockTransferRepository } from "../repositories/stock-transfer.repository";
import { ProductGoodsRepository } from "../repositories/product-goods.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { StockTransferStatus, StockMovementType, ServiceStatus, ProductType } from "@prisma/client";
import { db } from "../config/prisma";
import { getBusinessByOwnerIdService } from "./business.service";

export class StockTransferService extends BaseService {
  static async create(
    data: {
      senderOutletId: string;
      receiverOutletId: string;
      shippingDate: Date;
      note?: string;
      items: { productId: string; quantity: number }[];
    },
    userId: string
  ) {
    // 1. Fetch business for user
    const business = await getBusinessByOwnerIdService(userId);
    if (!business) {
      this.badRequest("Bisnis tidak ditemukan untuk pengguna ini.");
    }
    const businessId = business.id;

    // 2. Verify sender and receiver outlets exist and belong to the same business
    const [senderOutlet, receiverOutlet] = await Promise.all([
      OutletRepository.findById(data.senderOutletId),
      OutletRepository.findById(data.receiverOutletId),
    ]);

    if (!senderOutlet || senderOutlet.businessId !== businessId) {
      this.badRequest("Outlet pengirim tidak valid atau tidak dimiliki bisnis Anda.");
    }
    if (!receiverOutlet || receiverOutlet.businessId !== businessId) {
      this.badRequest("Outlet penerima tidak valid atau tidak dimiliki bisnis Anda.");
    }

    if (data.senderOutletId === data.receiverOutletId) {
      this.badRequest("Outlet pengirim dan penerima tidak boleh sama.");
    }

    // 3. Verify products exist, belong to sender outlet, and are type GOODS
    const verifiedItems = [];
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { goods: true },
      });

      if (!product || product.outletId !== data.senderOutletId) {
        this.badRequest(`Produk dengan ID ${item.productId} tidak ditemukan di outlet pengirim.`);
      }
      if (product.type !== ProductType.GOODS || !product.goods) {
        this.badRequest(`Produk ${product.name} bukan bertipe barang ritel (GOODS) dan tidak memiliki data stok.`);
      }

      verifiedItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // 4. Create Stock Transfer
    return StockTransferRepository.create({
      businessId,
      senderOutletId: data.senderOutletId,
      receiverOutletId: data.receiverOutletId,
      shippingDate: data.shippingDate,
      note: data.note,
      items: verifiedItems,
    });
  }

  static async getById(id: string, userId: string) {
    const business = await getBusinessByOwnerIdService(userId);
    const transfer = await StockTransferRepository.findById(id);

    if (!transfer) {
      this.notFound("Permintaan transfer stok tidak ditemukan.");
    }
    if (transfer.businessId !== business.id) {
      this.forbidden("Anda tidak memiliki akses ke transfer stok ini.");
    }

    return transfer;
  }

  static async getAll(query: any, userId: string) {
    const business = await getBusinessByOwnerIdService(userId);
    return StockTransferRepository.findAll(query, business.id);
  }

  static async updateStatus(id: string, status: StockTransferStatus, userId: string) {
    const business = await getBusinessByOwnerIdService(userId);
    const transfer = await StockTransferRepository.findById(id);

    if (!transfer) {
      this.notFound("Permintaan transfer stok tidak ditemukan.");
    }
    if (transfer.businessId !== business.id) {
      this.forbidden("Anda tidak memiliki akses ke transfer stok ini.");
    }

    const currentStatus = transfer.status;

    if (currentStatus === status) {
      return transfer;
    }

    // Disallow updates on completed transitions
    if (currentStatus === StockTransferStatus.RECEIVED) {
      this.badRequest("Stok transfer yang sudah diterima tidak dapat diubah lagi.");
    }
    if (currentStatus === StockTransferStatus.CANCELLED) {
      this.badRequest("Stok transfer yang sudah dibatalkan tidak dapat diubah lagi.");
    }

    // Execute state transitions
    if (status === StockTransferStatus.IN_TRANSIT) {
      if (currentStatus !== StockTransferStatus.PENDING) {
        this.badRequest("Hanya transfer dengan status PENDING yang dapat dikirim (IN_TRANSIT).");
      }

      // Check sender stock levels
      for (const item of transfer.items) {
        if (!item.product.goods) continue;
        if (item.product.goods.currentStock < item.quantity) {
          this.badRequest(
            `Stok untuk produk ${item.product.name} di outlet pengirim tidak mencukupi. ` +
              `Stok saat ini: ${item.product.goods.currentStock}, diperlukan: ${item.quantity}`
          );
        }
      }

      // Perform FIFO stock deduction and status update
      return db.$transaction(async (tx) => {
        for (const item of transfer.items) {
          if (!item.product.goods) continue;
          await ProductGoodsRepository.deductStockFIFO(
            item.product.goods.id,
            item.quantity,
            id,
            `Transfer stok ke ${transfer.receiverOutlet.name}`,
            tx
          );
        }

        return StockTransferRepository.updateStatus(id, StockTransferStatus.IN_TRANSIT, tx);
      });
    }

    if (status === StockTransferStatus.RECEIVED) {
      if (currentStatus !== StockTransferStatus.IN_TRANSIT) {
        this.badRequest("Hanya transfer dengan status DALAM PERJALANAN (IN_TRANSIT) yang dapat diterima.");
      }

      // Perform stock addition to the receiver outlet
      return db.$transaction(async (tx) => {
        for (const item of transfer.items) {
          if (!item.product.goods) continue;

          // 1. Find corresponding product in receiver outlet
          // We look for an active GOODS product with same SKU, same Barcode, or same Name
          const OR_clauses = [];
          if (item.product.goods.sku) {
            OR_clauses.push({ goods: { sku: item.product.goods.sku } });
          }
          if (item.product.goods.barcode) {
            OR_clauses.push({ goods: { barcode: item.product.goods.barcode } });
          }
          OR_clauses.push({ name: item.product.name });

          let receiverProduct = await tx.product.findFirst({
            where: {
              outletId: transfer.receiverOutletId,
              status: ServiceStatus.ACTIVE,
              type: ProductType.GOODS,
              OR: OR_clauses,
            },
            include: {
              goods: true,
            },
          });

          // 2. If receiver product doesn't exist, create it (auto-copy from sender)
          if (!receiverProduct) {
            // Find category
            let categoryId = null;
            if (item.product.categoryId) {
              const senderCategory = await tx.productCategory.findUnique({
                where: { id: item.product.categoryId },
              });
              if (senderCategory) {
                // Find or create category in receiver outlet
                let receiverCategory = await tx.productCategory.findFirst({
                  where: { outletId: transfer.receiverOutletId, name: senderCategory.name },
                });
                if (!receiverCategory) {
                  receiverCategory = await tx.productCategory.create({
                    data: {
                      name: senderCategory.name,
                      outletId: transfer.receiverOutletId,
                    },
                  });
                }
                categoryId = receiverCategory.id;
              }
            }

            // Verify barcode is globally unique
            let barcode = item.product.goods.barcode;
            if (barcode) {
              const existingBarcode = await tx.productGoods.findUnique({
                where: { barcode },
              });
              if (existingBarcode) {
                barcode = null; // Prevent unique constraint crash by omitting barcode if already used
              }
            }

            // Create product in receiver outlet
            receiverProduct = await tx.product.create({
              data: {
                name: item.product.name,
                description: item.product.description,
                type: ProductType.GOODS,
                status: ServiceStatus.ACTIVE,
                outletId: transfer.receiverOutletId,
                categoryId,
                image: item.product.image,
                taxPercentage: item.product.taxPercentage,
                taxName: item.product.taxName,
                goods: {
                  create: {
                    sku: item.product.goods.sku,
                    barcode,
                    unit: item.product.goods.unit || "unit",
                    averageHpp: item.product.goods.averageHpp || 0,
                    sellingPrice: item.product.goods.sellingPrice || 0,
                    currentStock: 0,
                  },
                },
              },
              include: {
                goods: true,
              },
            });
          }

          if (!receiverProduct.goods) {
            throw new AppError(
              `Produk tujuan ${receiverProduct.name} tidak memiliki data ritel (ProductGoods).`,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }

          // 3. Find HPP of the shipped batch from sender's OUT log
          const senderLog = await tx.stockLog.findFirst({
            where: {
              productGoodsId: item.product.goods.id,
              referenceId: id,
              type: StockMovementType.OUT,
            },
          });

          // Use the actual HPP from the stock log, with fallbacks
          const hpp = Math.abs(senderLog?.hppPerUnit || item.product.goods.averageHpp || 0);

          // 4. Add stock to receiver outlet
          await ProductGoodsRepository.addStockBatch(
            receiverProduct.goods.id,
            item.quantity,
            item.quantity * hpp,
            id,
            `Diterima dari outlet ${transfer.senderOutlet.name}`,
            undefined,
            tx,
            StockMovementType.IN
          );
        }

        return StockTransferRepository.updateStatus(id, StockTransferStatus.RECEIVED, tx);
      });
    }

    if (status === StockTransferStatus.CANCELLED) {
      // If PENDING: no stock deducted, just update status
      if (currentStatus === StockTransferStatus.PENDING) {
        return StockTransferRepository.updateStatus(id, StockTransferStatus.CANCELLED);
      }

      // If IN_TRANSIT: reverse the stock deduction back to sender outlet
      if (currentStatus === StockTransferStatus.IN_TRANSIT) {
        return db.$transaction(async (tx) => {
          for (const item of transfer.items) {
            if (!item.product.goods) continue;

            const senderLog = await tx.stockLog.findFirst({
              where: {
                productGoodsId: item.product.goods.id,
                referenceId: id,
                type: StockMovementType.OUT,
              },
            });

            const hpp = Math.abs(senderLog?.hppPerUnit || item.product.goods.averageHpp || 0);

            // Add stock back to sender (type RETURN)
            await ProductGoodsRepository.addStockBatch(
              item.product.goods.id,
              item.quantity,
              item.quantity * hpp,
              id,
              `Pembatalan transfer ke ${transfer.receiverOutlet.name}`,
              undefined,
              tx,
              StockMovementType.RETURN
            );
          }

          return StockTransferRepository.updateStatus(id, StockTransferStatus.CANCELLED, tx);
        });
      }

      this.badRequest("Tidak dapat membatalkan transfer stok dengan status ini.");
    }

    this.badRequest("Transisi status transfer stok tidak valid.");
  }
}
