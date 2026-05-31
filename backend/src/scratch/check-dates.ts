import { db } from "../config/prisma";

async function run() {
    console.log("=== CHECKING TRANSACTION DATES FOR TOKO SEMBAKO SEJAHTERA ===");
    const outlet = await db.outlet.findFirst({
        where: { name: { contains: "Toko Sembako" } }
    });

    if (!outlet) {
        console.error("Outlet Toko Sembako not found!");
        return;
    }

    console.log(`Outlet ID: ${outlet.id}`);

    // Get the first few orders
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
        },
        orderBy: { createdAt: "desc" },
        take: 10
    });

    console.log("\nRecent 10 orders:");
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

    // Get min and max dates of all orders
    const minOrder = await db.order.findFirst({
        where: { outletId: outlet.id },
        orderBy: { createdAt: "asc" }
    });
    const maxOrder = await db.order.findFirst({
        where: { outletId: outlet.id },
        orderBy: { createdAt: "desc" }
    });

    console.log("\nDate Range of all Orders:");
    console.log(`  Min Date (UTC): ${minOrder?.createdAt.toISOString()}`);
    console.log(`  Max Date (UTC): ${maxOrder?.createdAt.toISOString()}`);
}

run().catch(console.error).finally(() => db.$disconnect());
