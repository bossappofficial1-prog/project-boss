import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { db } from "../config/prisma";

async function main() {
  const members = await db.outletMembership.findMany({
    include: {
      guestCustomer: true,
    },
  });

  console.log(`Found ${members.length} members to sync.`);

  for (const member of members) {
    const orders = await db.order.findMany({
      where: {
        guestCustomerId: member.guestCustomerId,
        outletId: member.outletId,
        orderStatus: 'COMPLETED',
      },
    });

    const totalSpending = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    console.log(`Syncing member ${member.guestCustomer.phone}: Total Spending = ${totalSpending}`);

    await db.outletMembership.update({
      where: { id: member.id },
      data: { totalSpending: totalSpending },
    });
  }
  console.log("Sync completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
