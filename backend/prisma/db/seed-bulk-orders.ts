import {
  ProductType,
  OrderStatus,
  PaymentStatus,
  ManualPaymentType,
  StockMovementType,
  CustomerType,
  BillStatus,
  LoyaltyPointHistoryType,
  BookingSlotStatus,
  PurchaseOrderStatus,
} from "@prisma/client";
import { db } from "../../src/config/prisma";
import { addMinutes, subDays, setHours, startOfDay } from "date-fns";

const BUSINESS_ID = "BIZ-CSUHVTNPZ5";
const OWNER_ID = "9a3f581e-75e3-4f6b-878e-3422f54aebfb";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (daysAgo: number, daysMin = 0): Date => {
  const now = new Date();
  const past = subDays(now, daysAgo);
  const min = subDays(now, daysMin);
  return new Date(
    past.getTime() + Math.random() * (min.getTime() - past.getTime()),
  );
};

const randomHour = (date: Date, minH: number, maxH: number): Date => {
  const hour = rand(minH, maxH - 1);
  const minute = rand(0, 59);
  const d = startOfDay(date);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Bulk seeding orders for BOSS Team...\n");

  // Step 1: Cleanup existing orders
  await cleanupOrders();

  // Step 2: Fetch outlet data
  const outlets = await db.outlet.findMany({
    where: { businessId: BUSINESS_ID },
    include: {
      products: {
        include: { goods: true, service: true, ticket: true },
      },
      staff: true,
      tables: true,
      ingredients: true,
    },
  });

  const customers = await db.guestCustomer.findMany();

  const fnb = outlets.find((o) => o.type === "FNB")!;
  const retail = outlets.find((o) => o.type === "RETAIL")!;
  const service = outlets.find((o) => o.type === "SERVICE")!;
  const event = outlets.find((o) => o.type === "EVENT")!;

  // Step 3: Add retail stock
  await addRetailStock(retail.id);

  // Step 4: Increase event ticket quotas
  await increaseEventQuotas(event.id);

  // Step 5: Seed orders
  console.log("🍜 Seeding FNB orders (1000)...");
  await seedBulkFNB(fnb, customers);

  console.log("\n🛒 Seeding Retail orders (1000)...");
  await seedBulkRetail(retail, customers);

  console.log("\n💇 Seeding Service orders (800)...");
  await seedBulkService(service, customers);

  console.log("\n🎵 Seeding Event orders (800)...");
  await seedBulkEvent(event, customers);

  // Final summary
  console.log("\n🎉 Bulk seeding completed!");
  console.log("═══════════════════════════════════════");
  for (const o of outlets) {
    const count = await db.order.count({ where: { outletId: o.id } });
    const txCount = await db.transaction.count({
      where: { order: { outletId: o.id } },
    });
    console.log(`  ${o.name}: ${count} orders, ${txCount} transactions`);
  }
  console.log("═══════════════════════════════════════");
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanupOrders() {
  console.log("🧹 Cleaning existing orders...");
  const outlets = await db.outlet.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true },
  });
  const outletIds = outlets.map((o) => o.id);

  await db.loyaltyPointHistory.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.outletMembership.deleteMany({
    where: { outletId: { in: outletIds } },
  });
  await db.bookingSlot.deleteMany({
    where: { orderItemId: { not: null } },
  });
  await db.transaction.deleteMany({
    where: { order: { outletId: { in: outletIds } } },
  });
  await db.orderItem.deleteMany({
    where: { order: { outletId: { in: outletIds } } },
  });
  await db.order.deleteMany({ where: { outletId: { in: outletIds } } });
  await db.bill.deleteMany({ where: { outletId: { in: outletIds } } });

  console.log("  ✅ Orders cleaned");
}

// ─── Add Retail Stock ─────────────────────────────────────────────────────────

async function addRetailStock(outletId: string) {
  console.log("📦 Adding retail stock for 1000 orders...");

  const products = await db.product.findMany({
    where: { outletId, type: "GOODS" },
    include: { goods: true },
  });

  const suppliers = await db.supplier.findMany({ where: { outletId } });
  const supplier = suppliers[0];

  for (const p of products) {
    if (!p.goods) continue;
    const bulkQty = 500; // Enough for 1000 orders
    const totalCost = bulkQty * p.goods.averageHpp;

    const poDate = randomDate(90, 30);
    const poNumber = `PO-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplier?.id ?? (await db.supplier.findFirst({ where: { outletId } }))!.id,
        outletId,
        status: PurchaseOrderStatus.COMPLETED,
        notes: `Bulk stock ${p.name}`,
        totalEstimate: totalCost,
        createdAt: poDate,
        updatedAt: poDate,
      },
    });

    await db.purchaseOrderItem.create({
      data: {
        purchaseOrderId: po.id,
        productGoodsId: p.goods.id,
        quantity: bulkQty,
        priceAtOrder: p.goods.averageHpp,
      },
    });

    await db.productGoods.update({
      where: { id: p.goods.id },
      data: { currentStock: { increment: bulkQty } },
    });

    await db.stockLog.create({
      data: {
        productGoodsId: p.goods.id,
        type: StockMovementType.IN,
        quantity: bulkQty,
        hppPerUnit: p.goods.averageHpp,
        referenceType: "PURCHASE_ORDER",
        referenceId: po.id,
        notes: `Bulk purchase ${poNumber}`,
      },
    });
  }

  console.log("  ✅ Retail stock +500 per product");
}

// ─── Increase Event Quotas ────────────────────────────────────────────────────

async function increaseEventQuotas(outletId: string) {
  console.log("🎫 Increasing event ticket quotas...");

  const tickets = await db.productTicket.findMany({
    where: { product: { outletId } },
  });

  for (const t of tickets) {
    await db.productTicket.update({
      where: { id: t.id },
      data: {
        totalQuota: t.totalQuota + 1000,
        soldCount: 0, // Reset since we're recreating orders
      },
    });
  }

  console.log("  ✅ Ticket quotas increased by +1000 each, soldCount reset");
}

// ─── Bulk FNB Orders ──────────────────────────────────────────────────────────

async function seedBulkFNB(
  outlet: any,
  customers: any[],
) {
  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  const BATCH_SIZE = 50;
  const TOTAL = 1000;
  let created = 0;

  for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
    const batchItems = Math.min(BATCH_SIZE, TOTAL - batch);
    const orderPromises: Promise<any>[] = [];

    for (let i = 0; i < batchItems; i++) {
      const orderNum = batch + i + 1;
      const customer = pick(customers);
      const staff = pick(outlet.staff);
      const orderDate = randomDate(90, 0);
      const itemCount = rand(1, 4);
      const isDineIn = Math.random() < 0.6;

      const selectedProducts = [...outlet.products]
        .sort(() => Math.random() - 0.5)
        .slice(0, itemCount);

      let subtotal = 0;
      const itemsData = selectedProducts.map((p: any) => {
        const qty = rand(1, 3);
        const price = p.goods.sellingPrice;
        const hpp = p.goods.averageHpp;
        subtotal += price * qty;
        return { productId: p.id, quantity: qty, price, hpp, tax: p.taxPercentage ?? 0 };
      });

      const taxAmount = itemsData.reduce(
        (sum: number, item: any) => sum + Math.round(item.price * item.quantity * (item.tax / 100)),
        0,
      );
      const totalAmount = subtotal + taxAmount;

      let tableId: string | undefined;
      let tableNumber: string | undefined;
      let billId: string | undefined;

      if (isDineIn) {
        const table = pick(outlet.tables);
        tableId = table.id;
        tableNumber = table.name;
      }

      orderPromises.push(
        (async () => {
          if (isDineIn && tableId) {
            const bill = await db.bill.create({
              data: {
                outletId: outlet.id,
                tableId,
                status: BillStatus.PAID,
                total: totalAmount,
                closedAt: orderDate,
              },
            });
            billId = bill.id;
          }

          const order = await db.order.create({
            data: {
              outletId: outlet.id,
              guestCustomerId: customer.id,
              handledByStaffId: staff.id,
              totalAmount,
              taxAmount,
              orderStatus: OrderStatus.COMPLETED,
              paymentStatus: PaymentStatus.SUCCESS,
              customerType: CustomerType.GUEST,
              tableId: tableId ?? null,
              billId: billId ?? null,
              tableNumber: tableNumber ?? null,
              createdAt: orderDate,
              updatedAt: orderDate,
              items: {
                create: itemsData.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  priceAtTimeOfOrder: item.price,
                  hppAtTimeOfOrder: item.hpp,
                })),
              },
            },
          });

          await db.transaction.create({
            data: {
              orderId: order.id,
              amount: totalAmount,
              status: PaymentStatus.SUCCESS,
              isManual: true,
              manualMethod: pick(paymentMethods),
              verifiedAt: orderDate,
              verifiedById: OWNER_ID,
              cashReceived: totalAmount + rand(0, 5) * 10_000,
              cashChange: 0,
            },
          });

          const points = Math.floor(totalAmount / 10_000);
          if (points > 0) {
            await db.loyaltyPointHistory.create({
              data: {
                outletId: outlet.id,
                guestCustomerId: customer.id,
                orderId: order.id,
                type: LoyaltyPointHistoryType.EARN,
                points,
                note: "Poin dari transaksi",
              },
            });
          }
        })(),
      );
    }

    await Promise.all(orderPromises);
    created += batchItems;
    if (created % 200 === 0 || created === TOTAL) {
      console.log(`  📝 ${created}/${TOTAL} FNB orders created`);
    }
  }

  console.log("  ✅ FNB orders done");
}

// ─── Bulk Retail Orders ───────────────────────────────────────────────────────

async function seedBulkRetail(
  outlet: any,
  customers: any[],
) {
  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  const BATCH_SIZE = 50;
  const TOTAL = 1000;
  let created = 0;

  for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
    const batchItems = Math.min(BATCH_SIZE, TOTAL - batch);
    const orderPromises: Promise<any>[] = [];

    for (let i = 0; i < batchItems; i++) {
      const customer = pick(customers);
      const staff = pick(outlet.staff);
      const orderDate = randomDate(90, 0);
      const itemCount = rand(1, 5);

      const selectedProducts = [...outlet.products]
        .sort(() => Math.random() - 0.5)
        .slice(0, itemCount);

      let subtotal = 0;
      const itemsData = selectedProducts.map((p: any) => {
        const qty = rand(1, 4);
        const price = p.goods.sellingPrice;
        const hpp = p.goods.averageHpp;
        subtotal += price * qty;
        return { productId: p.id, goodsId: p.goods.id, quantity: qty, price, hpp, tax: p.taxPercentage ?? 0 };
      });

      const taxAmount = itemsData.reduce(
        (sum: number, item: any) => sum + Math.round(item.price * item.quantity * (item.tax / 100)),
        0,
      );
      const totalAmount = subtotal + taxAmount;

      orderPromises.push(
        (async () => {
          const order = await db.order.create({
            data: {
              outletId: outlet.id,
              guestCustomerId: customer.id,
              handledByStaffId: staff.id,
              totalAmount,
              taxAmount,
              orderStatus: OrderStatus.COMPLETED,
              paymentStatus: PaymentStatus.SUCCESS,
              customerType: CustomerType.GUEST,
              createdAt: orderDate,
              updatedAt: orderDate,
              items: {
                create: itemsData.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  priceAtTimeOfOrder: item.price,
                  hppAtTimeOfOrder: item.hpp,
                })),
              },
            },
          });

          await db.transaction.create({
            data: {
              orderId: order.id,
              amount: totalAmount,
              status: PaymentStatus.SUCCESS,
              isManual: true,
              manualMethod: pick(paymentMethods),
              verifiedAt: orderDate,
              verifiedById: OWNER_ID,
              cashReceived: totalAmount + rand(0, 10) * 10_000,
              cashChange: 0,
            },
          });

          for (const item of itemsData) {
            await db.stockLog.create({
              data: {
                productGoodsId: item.goodsId,
                type: StockMovementType.OUT,
                quantity: item.quantity,
                hppPerUnit: item.hpp,
                referenceType: "ORDER",
                referenceId: order.id,
              },
            });
          }

          const points = Math.floor(totalAmount / 5_000);
          if (points > 0) {
            await db.loyaltyPointHistory.create({
              data: {
                outletId: outlet.id,
                guestCustomerId: customer.id,
                orderId: order.id,
                type: LoyaltyPointHistoryType.EARN,
                points,
                note: "Poin dari transaksi",
              },
            });
          }
        })(),
      );
    }

    await Promise.all(orderPromises);
    created += batchItems;
    if (created % 200 === 0 || created === TOTAL) {
      console.log(`  📝 ${created}/${TOTAL} Retail orders created`);
    }
  }

  console.log("  ✅ Retail orders done");
}

// ─── Bulk Service Orders ──────────────────────────────────────────────────────

async function seedBulkService(
  outlet: any,
  customers: any[],
) {
  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  const services = outlet.products.filter(
    (p: any) => p.type === ProductType.SERVICE && p.service,
  );

  const TOTAL = 800;
  let created = 0;

  // Generate all order dates first, spread over 4 months
  const orderDates: Date[] = [];
  for (let i = 0; i < TOTAL; i++) {
    orderDates.push(randomDate(120, 0));
  }
  orderDates.sort((a, b) => a.getTime() - b.getTime());

  // Process in batches by day to manage booking slots
  const byDay = new Map<string, Date[]>();
  for (const d of orderDates) {
    const key = d.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(d);
  }

  for (const [dayKey, dayDates] of byDay) {
    const dayPromises: Promise<any>[] = [];

    for (const orderDate of dayDates) {
      const customer = pick(customers);
      const staff = pick(outlet.staff);
      const product = pick(services);
      const svc = product.service;
      if (!svc) continue;

      const totalAmount = svc.sellingPrice;
      const bookingStart = randomHour(orderDate, 10, 18);
      const bookingEnd = addMinutes(bookingStart, svc.durationMinutes);

      dayPromises.push(
        (async () => {
          const bookingSlot = await db.bookingSlot.create({
            data: {
              date: orderDate,
              startTime: bookingStart,
              endTime: bookingEnd,
              status: BookingSlotStatus.BOOKED,
              productServiceId: svc.id,
            },
          });

          const order = await db.order.create({
            data: {
              outletId: outlet.id,
              guestCustomerId: customer.id,
              handledByStaffId: staff.id,
              totalAmount,
              taxAmount: 0,
              orderStatus: OrderStatus.COMPLETED,
              paymentStatus: PaymentStatus.SUCCESS,
              customerType: CustomerType.GUEST,
              bookingDate: orderDate,
              bookingDurationMinutes: svc.durationMinutes,
              createdAt: orderDate,
              updatedAt: orderDate,
              items: {
                create: [
                  {
                    productId: product.id,
                    quantity: 1,
                    priceAtTimeOfOrder: totalAmount,
                    hppAtTimeOfOrder: 0,
                  },
                ],
              },
            },
          });

          const orderItem = await db.orderItem.findFirst({
            where: { orderId: order.id },
          });
          if (orderItem) {
            await db.bookingSlot.update({
              where: { id: bookingSlot.id },
              data: { orderItemId: orderItem.id },
            });
          }

          await db.transaction.create({
            data: {
              orderId: order.id,
              amount: totalAmount,
              status: PaymentStatus.SUCCESS,
              isManual: true,
              manualMethod: pick(paymentMethods),
              verifiedAt: orderDate,
              verifiedById: OWNER_ID,
              cashReceived: totalAmount,
              cashChange: 0,
            },
          });

          const points = Math.floor(totalAmount / 20_000);
          if (points > 0) {
            await db.loyaltyPointHistory.create({
              data: {
                outletId: outlet.id,
                guestCustomerId: customer.id,
                orderId: order.id,
                type: LoyaltyPointHistoryType.EARN,
                points,
                note: "Poin dari transaksi",
              },
            });
          }
        })(),
      );
    }

    await Promise.all(dayPromises);
    created += dayDates.length;
    if (created % 100 === 0 || created === TOTAL) {
      console.log(`  📝 ${created}/${TOTAL} Service orders created`);
    }
  }

  console.log("  ✅ Service orders done");
}

// ─── Bulk Event Orders ────────────────────────────────────────────────────────

async function seedBulkEvent(
  outlet: any,
  customers: any[],
) {
  const paymentMethods: ManualPaymentType[] = [
    ManualPaymentType.CASH,
    ManualPaymentType.QRIS_OFFLINE,
    ManualPaymentType.OWNER_TRANSFER,
  ];

  const tickets = outlet.products.filter(
    (p: any) => p.type === ProductType.TICKET && p.ticket,
  );

  const TOTAL = 800;
  let created = 0;

  const BATCH_SIZE = 50;

  for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
    const batchItems = Math.min(BATCH_SIZE, TOTAL - batch);
    const orderPromises: Promise<any>[] = [];

    for (let i = 0; i < batchItems; i++) {
      const customer = pick(customers);
      const staff = pick(outlet.staff);
      const product = pick(tickets);
      const ticket = product.ticket;
      if (!ticket) continue;

      const orderDate = randomDate(120, 0);
      const qty = rand(1, 4);
      const totalAmount = ticket.sellingPrice * qty;

      orderPromises.push(
        (async () => {
          const order = await db.order.create({
            data: {
              outletId: outlet.id,
              guestCustomerId: customer.id,
              handledByStaffId: staff.id,
              totalAmount,
              taxAmount: 0,
              orderStatus: OrderStatus.COMPLETED,
              paymentStatus: PaymentStatus.SUCCESS,
              customerType: CustomerType.GUEST,
              createdAt: orderDate,
              updatedAt: orderDate,
              items: {
                create: [
                  {
                    productId: product.id,
                    quantity: qty,
                    priceAtTimeOfOrder: ticket.sellingPrice,
                    hppAtTimeOfOrder: 0,
                  },
                ],
              },
            },
          });

          await db.transaction.create({
            data: {
              orderId: order.id,
              amount: totalAmount,
              status: PaymentStatus.SUCCESS,
              isManual: true,
              manualMethod: pick(paymentMethods),
              verifiedAt: orderDate,
              verifiedById: OWNER_ID,
              cashReceived: totalAmount,
              cashChange: 0,
            },
          });

          await db.productTicket.update({
            where: { id: ticket.id },
            data: { soldCount: { increment: qty } },
          });

          const points = Math.floor(totalAmount / 15_000);
          if (points > 0) {
            await db.loyaltyPointHistory.create({
              data: {
                outletId: outlet.id,
                guestCustomerId: customer.id,
                orderId: order.id,
                type: LoyaltyPointHistoryType.EARN,
                points,
                note: "Poin dari transaksi",
              },
            });
          }
        })(),
      );
    }

    await Promise.all(orderPromises);
    created += batchItems;
    if (created % 100 === 0 || created === TOTAL) {
      console.log(`  📝 ${created}/${TOTAL} Event orders created`);
    }
  }

  console.log("  ✅ Event orders done");
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
