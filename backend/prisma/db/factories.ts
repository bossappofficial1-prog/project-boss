import {
  PrismaClient,
  ProductType,
  PaymentStatus,
  OrderStatus,
  StockMovementType,
} from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

export class DatabaseFactory {
  constructor(private prisma: PrismaClient) {}

  async createDummyProducts(outletId: string, count: number) {
    const createdProducts = [];
    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement([ProductType.GOODS, ProductType.SERVICE]);
      const price = faker.number.int({ min: 5, max: 150 }) * 1000;

      const product = await this.prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          type,
          outletId,
          status: "ACTIVE",
          image: faker.image.url({ width: 800, height: 800 }),
        },
      });

      if (type === ProductType.GOODS) {
        const hpp = Math.floor(price * faker.number.float({ min: 0.5, max: 0.8 }));
        const stock = faker.number.int({ min: 50, max: 500 });

        const goods = await this.prisma.productGoods.create({
          data: {
            productId: product.id,
            currentStock: stock,
            minStock: 10,
            unit: faker.helpers.arrayElement(["pcs", "kg", "box", "pack"]),
            sellingPrice: price,
            averageHpp: hpp,
          },
        });

        // Initial stock entry for HPP calculation
        await this.prisma.stockLog.create({
          data: {
            type: StockMovementType.IN,
            quantity: stock,
            hppPerUnit: hpp,
            referenceType: "MANUAL",
            notes: "Initial stock from factory",
            productGoodsId: goods.id,
            createdAt: faker.date.past({ years: 1 }),
          },
        });

        createdProducts.push({ ...product, price, type });
      } else {
        const service = await this.prisma.productService.create({
          data: {
            productId: product.id,
            durationMinutes: faker.helpers.arrayElement([30, 45, 60, 90, 120]),
            sellingPrice: price,
            providerName: faker.person.fullName(),
            commissionType: "PERCENTAGE",
            commissionValue: faker.number.int({ min: 5, max: 25 }),
            maxParallel: faker.number.int({ min: 1, max: 4 }),
          },
        });

        await this.prisma.serviceOperatingHours.createMany({
          data: Array.from({ length: 7 }, (_, day) => ({
            productServiceId: service.id,
            dayOfWeek: day,
            openTime: new Date("1970-01-01T02:00:00Z"),
            closeTime: new Date("1970-01-01T14:00:00Z"),
            isOpen: day !== 0, // Minggu tutup
            isRestEnabled: false,
          })),
        });

        createdProducts.push({ ...product, price, type });
      }
    }
    return createdProducts;
  }

  async createDummyTransactions(
    outletId: string,
    products: any[],
    count: number,
    startDate: Date,
    endDate: Date,
  ) {
    for (let i = 0; i < count; i++) {
      const date = faker.date.between({ from: startDate, to: endDate });

      // Memilih produk acak untuk pesanan ini
      const itemCount = faker.number.int({ min: 1, max: 4 });
      const orderProducts = faker.helpers.arrayElements(products, itemCount);

      let subtotal = 0;
      const itemsData = orderProducts.map((p) => {
        const qty = faker.number.int({ min: 1, max: 3 });
        subtotal += p.price * qty;
        return {
          productId: p.id,
          quantity: qty,
          priceAtTimeOfOrder: p.price,
        };
      });

      const midtransFee = Math.round(subtotal * 0.007);
      const appFee = Math.round(subtotal * 0.02);
      const totalAmount = subtotal + midtransFee + appFee;

      const guestCustomer = await this.prisma.guestCustomer.create({
        data: {
          name: faker.person.fullName(),
          phone: "+628" + faker.string.numeric(10),
          email: faker.internet.email(),
          createdAt: date,
        },
      });

      const midtransToken = `MID-${outletId.slice(0, 8)}-${faker.string.alphanumeric(6)}`;

      const order = await this.prisma.order.create({
        data: {
          totalAmount,
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: OrderStatus.COMPLETED,
          paymentReminderSent: true,
          midtransTransactionToken: midtransToken,
          midtransRedirectUrl: `https://payments.example.com/${midtransToken}`,
          guestCustomerId: guestCustomer.id,
          outletId: outletId,
          midtransFee,
          appFee,
          createdAt: date,
          updatedAt: date,
          items: {
            create: itemsData,
          },
        },
      });

      await this.prisma.transaction.create({
        data: {
          amount: totalAmount,
          paymentMethod: faker.helpers.arrayElement([
            "qris",
            "gopay",
            "bca_va",
            "mandiri_va",
            "cash",
          ]),
          status: PaymentStatus.SUCCESS,
          paymentUrl: order.midtransRedirectUrl,
          externalId: `TRX-${midtransToken}`,
          orderId: order.id,
          createdAt: date,
          isManual: false,
        },
      });

      // Update stok barang dan catat pengeluaran stok
      for (const item of itemsData) {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.type === ProductType.GOODS) {
          const pg = await this.prisma.productGoods.findUnique({
            where: { productId: product.id },
          });
          if (pg) {
            await this.prisma.productGoods.update({
              where: { id: pg.id },
              data: { currentStock: { decrement: item.quantity } },
            });
            await this.prisma.stockLog.create({
              data: {
                type: StockMovementType.OUT,
                quantity: item.quantity,
                referenceType: "ORDER",
                referenceId: order.id,
                notes: `Terjual via Order (Faker)`,
                productGoodsId: pg.id,
                createdAt: date,
              },
            });
          }
        }
      }
    }
  }

  async createDummyExpenses(outletId: string, count: number, startDate: Date, endDate: Date) {
    for (let i = 0; i < count; i++) {
      const date = faker.date.between({ from: startDate, to: endDate });
      await this.prisma.expense.create({
        data: {
          cashier: "Owner",
          description: faker.helpers.arrayElement([
            "Listrik",
            "Air",
            "Internet",
            "Gaji Karyawan",
            "Bahan Baku Tambahan",
            "Perbaikan AC",
            "Pemasaran",
            "Kebersihan",
            "Lain-lain",
          ]),
          amount: faker.number.int({ min: 50, max: 2000 }) * 1000,
          date: date,
          outletId: outletId,
          createdAt: date,
          updatedAt: date,
        },
      });
    }
  }
}
