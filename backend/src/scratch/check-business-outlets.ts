import { db } from "../config/prisma";

async function run() {
    console.log("=== CHECKING OUTLET OWNERSHIP BY BUSINESS ===");
    const businesses = await db.business.findMany({
        include: {
            outlets: true
        }
    });

    for (const b of businesses) {
        console.log(`Business: ${b.name} (ID: ${b.id})`);
        for (const o of b.outlets) {
            console.log(`  Outlet: ${o.name} (${o.type}) (ID: ${o.id})`);
            const successOrders = await db.order.count({
                where: { outletId: o.id, paymentStatus: "SUCCESS" }
            });
            console.log(`    Success Orders: ${successOrders}`);
        }
    }
}

run().catch(console.error).finally(() => db.$disconnect());
