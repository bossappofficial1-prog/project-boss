import { BaseService } from "./base.service";
import { PurchaseOrderRepository } from "../repositories/purchase-order.repository";
import { ProductGoodsRepository } from "../repositories/product-goods.repository";
import { IngredientRepository } from "../repositories/ingredient.repository";
import { db } from "../config/prisma";
import { EmailService } from "./email.service";
import { PurchaseOrderStatus, StockMovementType } from "@prisma/client";

import { SupplierRepository } from "../repositories/supplier.repository";

export class PurchaseOrderService extends BaseService {
  /**
   * Pemicu otomatis draf PO ketika stok suatu produk/bahan menipis (currentStock <= minStock)
   */
  static async triggerLowStockAutoPO(
    outletId: string,
    itemType: "GOODS" | "INGREDIENT",
    itemId: string
  ) {
    try {
      if (itemType === "GOODS") {
        const productGoods = await ProductGoodsRepository.findById(itemId);
        if (!productGoods) return;

        const minStock = productGoods.minStock;
        if (minStock === null || minStock === undefined) return;

        // Cek jika stok saat ini menipis
        if (productGoods.currentStock <= minStock) {
          // Cari supplier yang terasosiasi dengan produk ini
          const supplierProducts = await SupplierRepository.findByProduct(itemId);
          if (supplierProducts.length === 0) {
            console.log(`[Auto-PO] ProductGoods ${productGoods.product.name} low stock (${productGoods.currentStock} <= ${minStock}) but no supplier associated. Skipping draft creation.`);
            return;
          }

          // Gunakan supplier paling terakhir/utama
          const primarySupplier = supplierProducts[0].supplier;
          
          // Cari draf PO aktif untuk supplier dan outlet ini
          let draftPO = await PurchaseOrderRepository.findDraftBySupplierAndOutlet(
            primarySupplier.id,
            outletId
          );

          // Hitung kuantitas pesanan pintar
          let orderQty = minStock * 2;
          if (productGoods.maxStock && productGoods.maxStock > productGoods.currentStock) {
            orderQty = productGoods.maxStock - productGoods.currentStock;
          }
          if (orderQty <= 0) orderQty = 10; // safety fallback

          const priceAtOrder = productGoods.averageHpp || productGoods.sellingPrice * 0.6; // fallback estimate

          if (draftPO) {
            // Tambahkan atau perbarui item dalam draf PO
            await PurchaseOrderRepository.addOrUpdateItem(draftPO.id, {
              productGoodsId: itemId,
              quantity: orderQty,
              priceAtOrder,
            });
            console.log(`[Auto-PO] Updated existing draft PO #${draftPO.poNumber} for ${productGoods.product.name} (Qty: ${orderQty}).`);
          } else {
            // Buat draf PO baru
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const randHex = Math.random().toString(16).slice(2, 6).toUpperCase();
            const poNumber = `PO-${dateStr}-${randHex}`;

            draftPO = await PurchaseOrderRepository.create(
              {
                poNumber,
                supplierId: primarySupplier.id,
                outletId,
                notes: "Dibuat otomatis oleh Sistem Asisten Pemicu Stok Minimum BOSS.",
              },
              [
                {
                  productGoodsId: itemId,
                  quantity: orderQty,
                  priceAtOrder,
                },
              ]
            );
            console.log(`[Auto-PO] Created new draft PO #${poNumber} for ${productGoods.product.name} (Qty: ${orderQty}).`);
          }

          // Sync SupplierProduct: upsert relasi supplier-produk agar tampil di halaman Supplier Owner
          await db.supplierProduct.upsert({
            where: {
              supplierId_productGoodsId: {
                supplierId: primarySupplier.id,
                productGoodsId: itemId,
              },
            },
            create: {
              supplierId: primarySupplier.id,
              productGoodsId: itemId,
              lastPrice: priceAtOrder,
              lastOrderDate: new Date(),
            },
            update: {
              lastPrice: priceAtOrder,
              lastOrderDate: new Date(),
            },
          });
        }
      } else if (itemType === "INGREDIENT") {
        const ingredient = await IngredientRepository.findById(itemId);
        if (!ingredient) return;

        const minStock = ingredient.minStock;
        if (minStock === null || minStock === undefined) return;

        // Cek jika stok saat ini menipis
        if (ingredient.currentStock <= minStock) {
          // Cari supplier apa pun yang terdaftar untuk outlet ini sebagai fallback
          const outletSuppliers = await db.supplier.findMany({
            where: { outletId },
            orderBy: { name: "asc" },
          });

          if (outletSuppliers.length === 0) {
            console.log(`[Auto-PO] Ingredient ${ingredient.name} low stock (${ingredient.currentStock} <= ${minStock}) but no suppliers found in outlet ${outletId}. Skipping draft.`);
            return;
          }

          // Gunakan supplier pertama outlet sebagai fallback utama
          const primarySupplier = outletSuppliers[0];

          let draftPO = await PurchaseOrderRepository.findDraftBySupplierAndOutlet(
            primarySupplier.id,
            outletId
          );

          // Hitung kuantitas pesanan dalam satuan purchaseUnit
          // minStock dan currentStock dalam recipeUnit, kita bagi dengan conversionFactor
          const recipeQtyNeeded = minStock * 2;
          let orderQty = Math.ceil(recipeQtyNeeded / ingredient.conversionFactor);
          if (orderQty <= 0) orderQty = 5; // fallback 5 purchaseUnits

          const priceAtOrder = ingredient.averageCost * ingredient.conversionFactor || 50000; // fallback estimate

          if (draftPO) {
            await PurchaseOrderRepository.addOrUpdateItem(draftPO.id, {
              ingredientId: itemId,
              quantity: orderQty,
              priceAtOrder,
            });
            console.log(`[Auto-PO] Updated existing draft PO #${draftPO.poNumber} for Ingredient ${ingredient.name} (Qty: ${orderQty}).`);
          } else {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const randHex = Math.random().toString(16).slice(2, 6).toUpperCase();
            const poNumber = `PO-${dateStr}-${randHex}`;

            draftPO = await PurchaseOrderRepository.create(
              {
                poNumber,
                supplierId: primarySupplier.id,
                outletId,
                notes: "Dibuat otomatis oleh Sistem Asisten Pemicu Stok Minimum Bahan Baku BOSS.",
              },
              [
                {
                  ingredientId: itemId,
                  quantity: orderQty,
                  priceAtOrder,
                },
              ]
            );
            console.log(`[Auto-PO] Created new draft PO #${poNumber} for Ingredient ${ingredient.name} (Qty: ${orderQty}).`);
          }
        }
      }
    } catch (error) {
      console.error("[Auto-PO] Gagal memproses pemicu stok menipis:", error);
    }
  }

  /**
   * Mengirim Purchase Order resmi ke Supplier via Email & simulasi WA
   */
  static async sendPOToSupplier(id: string) {
    const po = await PurchaseOrderRepository.findById(id);
    if (!po) this.notFound("Purchase Order tidak ditemukan");

    if (po.status !== "DRAFT") {
      this.badRequest("Hanya draf Purchase Order yang dapat dikirim");
    }

    const { supplier, outlet } = po;

    // 1. Kirim Email (Jika Supplier memiliki Email)
    if (supplier.email) {
      const emailSubject = `[PESANAN RESMI] Surat Purchase Order ${po.poNumber} - ${outlet.name}`;
      
      const itemsListHtml = po.items
        .map((item, index) => {
          const name = item.productGoods?.product.name || item.ingredient?.name || "Barang";
          const unit = item.productGoods?.unit || item.ingredient?.purchaseUnit || "Unit";
          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><b>${name}</b></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity} ${unit}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${item.priceAtOrder.toLocaleString("id-ID")}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${(item.quantity * item.priceAtOrder).toLocaleString("id-ID")}</td>
            </tr>
          `;
        })
        .join("");

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
          <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">PURCHASE ORDER</h2>
          <p>Halo <b>${supplier.name}</b>,</p>
          <p>Berikut adalah rincian pesanan pembelian barang resmi dari <b>${outlet.name}</b>:</p>
          
          <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="width: 40%; color: #666;">Nomor PO</td>
              <td><b>${po.poNumber}</b></td>
            </tr>
            <tr>
              <td style="color: #666;">Tanggal Pemesanan</td>
              <td>${new Date(po.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}</td>
            </tr>
            <tr>
              <td style="color: #666;">Alamat Pengiriman</td>
              <td>${outlet.address || "-"}</td>
            </tr>
            <tr>
              <td style="color: #666;">Nomor Telepon Outlet</td>
              <td>${outlet.phone || "-"}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">No</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Nama Barang</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Jumlah</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Harga</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="padding: 8px; text-align: right; font-weight: bold;">Estimasi Total Pembayaran:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #ea580c;">Rp ${po.totalEstimate.toLocaleString("id-ID")}</td>
              </tr>
            </tfoot>
          </table>

          ${po.notes ? `<div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 20px;"><b>Catatan Tambahan:</b><br/>${po.notes}</div>` : ""}

          <p style="font-size: 13px; color: #666; margin-top: 30px;">
            Mohon segera proses pesanan kami dan kirimkan konfirmasi ketersediaan barang beserta tanggal pengiriman.<br/>
            Terima kasih atas kerja samanya.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 11px; color: #999; text-align: center;">Pesan otomatis dikirim oleh Platform Aplikasi BOSS SaaS.</p>
        </div>
      `;

      try {
        await EmailService.sendEmail({
          to: supplier.email,
          subject: emailSubject,
          text: `Halo ${supplier.name}, berikut adalah pesanan Purchase Order resmi dari ${outlet.name} dengan nomor ${po.poNumber} senilai total Rp ${po.totalEstimate.toLocaleString("id-ID")}.`,
          html: emailHtml,
        });
      } catch (err: any) {
        console.error(`[Email Alert] Gagal mengirim email ke supplier: ${err.message}`);
      }
    }

    // 2. Simulasi Notifikasi WhatsApp Resmi ke Supplier
    const waPhone = supplier.phone || "081234567890";
    const waText = `*[PURCHASE ORDER RESMI - ${outlet.name.toUpperCase()}]*\n\n` +
      `Halo *${supplier.name}*,\n` +
      `Kami telah mengirimkan Purchase Order resmi ke email Anda.\n\n` +
      `• *Nomor PO:* ${po.poNumber}\n` +
      `• *Estimasi Total:* Rp ${po.totalEstimate.toLocaleString("id-ID")}\n` +
      `• *Item Pesanan:*\n` +
      po.items.map((it, idx) => {
        const name = it.productGoods?.product.name || it.ingredient?.name || "Barang";
        const unit = it.productGoods?.unit || it.ingredient?.purchaseUnit || "Unit";
        return `  ${idx + 1}. ${name} (${it.quantity} ${unit})`;
      }).join("\n") +
      `\n\nMohon segera konfirmasi pesanan ini. Terima kasih!`;

    console.log(`\n============== [WHATSAPP SIMULATION GATEWAY] ==============`);
    console.log(`TO (Supplier phone): ${waPhone}`);
    console.log(`MESSAGE:\n${waText}`);
    console.log(`============================================================\n`);

    // Perbarui status PO ke SENT
    return PurchaseOrderRepository.updateStatus(id, "SENT");
  }

  /**
   * Menyelesaikan PO dan secara otomatis memasukkan kuantitas pesanan ke batch stok masuk (FIFO/FEFO)
   */
  static async completePurchaseOrder(id: string) {
    const po = await PurchaseOrderRepository.findById(id);
    if (!po) this.notFound("Purchase Order tidak ditemukan");

    if (po.status !== "SENT") {
      this.badRequest("Hanya Purchase Order berstatus 'SENT' (dikirim) yang dapat diselesaikan");
    }

    return db.$transaction(async (tx) => {
      for (const item of po.items) {
        if (item.productGoodsId) {
          // Input batch stok retail secara otomatis (IN)
          await ProductGoodsRepository.addStockBatch(
            item.productGoodsId,
            Math.round(item.quantity),
            item.quantity * item.priceAtOrder,
            po.poNumber,
            `One-click PO restock: ${po.poNumber}`,
            undefined,
            tx,
            StockMovementType.IN
          );
        } else if (item.ingredientId) {
          // Input batch stok bahan baku FnB secara otomatis (IN)
          // Repository IngredientRepository.addStockBatch menggunakan global db, tapi karena di sini kita berada di dalam transaksi, 
          // mari kita panggil repository langsung atau secara aman agar db sync tetap terjaga. 
          // Catatan: addStockBatch menggunakan db.$transaction secara internal. Untuk kompatibilitas aman, kita panggil secara langsung.
          await IngredientRepository.addStockBatch(
            item.ingredientId,
            item.quantity, // dalam purchaseUnit
            item.quantity * item.priceAtOrder, // totalCost
            po.poNumber,
            `One-click PO restock: ${po.poNumber}`
          );
        }
      }

      // Update PO status ke COMPLETED
      return PurchaseOrderRepository.updateStatus(id, "COMPLETED", tx);
    }, { timeout: 30000 });
  }
}
