import { db } from "../config/prisma";

async function run() {
    console.log("=== CHECKING DATES FOR PITOK CABANG 1 ===");
    const outlet = await db.outlet.findFirst({
        where: { name: { contains: "Pitok Cabang 1" } }
    });

    if (!outlet) {
        console.error("Outlet Pitok Cabang 1 not found!");
        return;
    }

    console.log(`Outlet ID: ${outlet.id}`);

    const orders = await db.order.findMany({
        where: { outletId: outlet.id },
        select: {
            id: true,
            paymentStatus: true,
            createdAt: true,
            transaction: {
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                }
            }
        }
    });

    console.log(`\nFound ${orders.length} orders:`);
    for (const o of orders) {
        console.log(`Order ID: ${o.id}`);
        console.log(`  paymentStatus: ${o.paymentStatus}`);
        console.log(`  createdAt (UTC): ${o.createdAt.toISOString()}`);
        if (o.transaction) {
            console.log(`  Transaction ID: ${o.transaction.id}`);
            console.log(`    status: ${o.transaction.status}`);
            console.log(`    createdAt (UTC): ${o.transaction.createdAt.toISOString()}`);
        } else {
            console.log(`  Transaction: NONE`);
        }
    }
}

run().catch(console.error).finally(() => db.$disconnect());
