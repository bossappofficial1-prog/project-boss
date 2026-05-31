import { db } from "../config/prisma";

async function run() {
    console.log("=== CHECKING OUTLETS ===");
    const outlets = await db.outlet.findMany({
        select: {
            id: true,
            name: true,
            type: true,
        }
    });

    for (const o of outlets) {
        const orderCount = await db.order.count({ where: { outletId: o.id } });
        const successOrderCount = await db.order.count({ where: { outletId: o.id, paymentStatus: "SUCCESS" } });
        const transactionCount = await db.transaction.count({
            where: {
                order: { outletId: o.id }
            }
        });
        const successTransactionCount = await db.transaction.count({
            where: {
                order: { outletId: o.id },
                status: "SUCCESS"
            }
        });

        console.log(`Outlet: ${o.name} (${o.type})`);
        console.log(`  Total Orders: ${orderCount}`);
        console.log(`  Success Orders: ${successOrderCount}`);
        console.log(`  Total Transactions: ${transactionCount}`);
        console.log(`  Success Transactions: ${successTransactionCount}`);
    }
}

run().catch(console.error).finally(() => db.$disconnect());
