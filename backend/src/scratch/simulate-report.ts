import { db } from "../config/prisma";
import { computeTotalsByFilter, computeCountsByFilter } from "../repositories/transaction.repository";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

async function run() {
    console.log("=== SIMULATING DAILY SALES REPORT ===");
    
    // Simulate report date (yesterday relative to 2026-05-31)
    const now = new Date("2026-05-31T09:25:56");
    const reportDate = new Date(now);
    reportDate.setDate(now.getDate() - 1);

    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    console.log(`Report Date: ${format(reportDate, "yyyy-MM-dd")}`);
    console.log(`startDate (ISO): ${startISO}`);
    console.log(`endDate (ISO): ${endISO}`);

    const outlet = await db.outlet.findFirst({
        where: { name: { contains: "Toko Sembako" } }
    });

    if (!outlet) {
        console.error("Outlet Toko Sembako not found!");
        return;
    }

    const filter = {
        outletId: outlet.id,
        userOutletIds: [outlet.id],
        startDate: startISO,
        endDate: endISO,
    };

    console.log("\n--- RUNNING COMPUTE FUNCTIONS ---");
    const totals = await computeTotalsByFilter(filter, ["SUCCESS", "PROOF_SUBMITTED"]);
    const counts = await computeCountsByFilter(filter);

    console.log("Totals:", totals);
    console.log("Counts:", counts);

    // Let's run raw query counts on Order table directly for this range
    const directOrderCount = await db.order.count({
        where: {
            outletId: outlet.id,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    // Let's run raw query counts on Transaction table directly for this range
    const directTransactionCount = await db.transaction.count({
        where: {
            order: { outletId: outlet.id },
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    console.log(`\nDirect Order Count in Range: ${directOrderCount}`);
    console.log(`Direct Transaction Count in Range: ${directTransactionCount}`);
}

run().catch(console.error).finally(() => db.$disconnect());
