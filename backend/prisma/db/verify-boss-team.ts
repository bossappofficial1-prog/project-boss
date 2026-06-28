import { db } from "../../src/config/prisma";

async function main() {
  const BUSINESS_ID = "BIZ-CSUHVTNPZ5";

  const outlets = await db.outlet.findMany({
    where: { businessId: BUSINESS_ID },
    select: { id: true, name: true, type: true },
  });

  console.log("📊 BOSS Team Data Summary");
  console.log("═══════════════════════════════════════════════");

  for (const o of outlets) {
    const orders = await db.order.count({ where: { outletId: o.id } });
    const transactions = await db.transaction.count({
      where: { order: { outletId: o.id } },
    });
    const loyaltyPoints = await db.loyaltyPointHistory.count({
      where: { outletId: o.id },
    });
    const bills = await db.bill.count({ where: { outletId: o.id } });
    const bookingSlots = await db.bookingSlot.count({ where: { orderItemId: { not: null } } });

    console.log(`\n🏪 ${o.name} (${o.type})`);
    console.log(`   Orders: ${orders}`);
    console.log(`   Transactions: ${transactions}`);
    console.log(`   Loyalty Points: ${loyaltyPoints}`);
    if (o.type === "FNB") console.log(`   Bills: ${bills}`);
    if (o.type === "SERVICE") console.log(`   Booking Slots: ${bookingSlots}`);
  }

  console.log("\n═══════════════════════════════════════════════");

  const totalOrders = await db.order.count({
    where: { outlet: { businessId: BUSINESS_ID } },
  });
  const totalTransactions = await db.transaction.count({
    where: { order: { outlet: { businessId: BUSINESS_ID } } },
  });

  console.log(`\n📈 Total: ${totalOrders} orders, ${totalTransactions} transactions`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
