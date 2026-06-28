import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const bizId = "BIZ-CSUHVTNPZ5";
const outlets = await db.outlet.findMany({
  where: { businessId: bizId },
  select: { id: true, name: true, type: true },
});

for (const o of outlets) {
  console.log(`\n=== ${o.name} (${o.type}) ===`);

  const products = await db.product.findMany({
    where: { outletId: o.id },
    select: {
      id: true,
      name: true,
      type: true,
      goods: { select: { sellingPrice: true, currentStock: true, id: true } },
      service: { select: { sellingPrice: true, durationMinutes: true, id: true } },
      ticket: { select: { sellingPrice: true, totalQuota: true, soldCount: true, id: true } },
    },
  });
  console.log(`  Products: ${products.length}`);
  for (const p of products) {
    const price = p.goods?.sellingPrice ?? p.service?.sellingPrice ?? p.ticket?.sellingPrice ?? 0;
    const extra = p.goods
      ? `stock:${p.goods.currentStock}`
      : p.service
        ? `dur:${p.service.durationMinutes}min`
        : `quota:${p.ticket?.totalQuota} sold:${p.ticket?.soldCount}`;
    console.log(`    ${p.name}: Rp${price.toLocaleString()} (${extra})`);
  }

  const staff = await db.staff.findMany({ where: { outletId: o.id }, select: { id: true, name: true } });
  console.log(`  Staff: ${staff.map((s) => s.name).join(", ")}`);

  const existingOrders = await db.order.count({ where: { outletId: o.id } });
  console.log(`  Existing orders: ${existingOrders}`);

  if (o.type === "FNB") {
    const tables = await db.outletTable.findMany({ where: { outletId: o.id }, select: { id: true, name: true } });
    console.log(`  Tables: ${tables.map((t) => t.name).join(", ")}`);
    const ingredients = await db.ingredient.findMany({ where: { outletId: o.id }, select: { name: true, currentStock: true, recipeUnit: true } });
    console.log(`  Ingredients: ${ingredients.length}`);
  }
}

const totalCustomers = await db.guestCustomer.count();
console.log(`\nTotal customers: ${totalCustomers}`);

await db.$disconnect();
