import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const orders = await db.order.findMany({
    where: {
      orderStatus: "COMPLETED",
    },
    include: {
      handledByStaff: true,
      items: {
        include: {
          product: {
            include: {
              service: true,
            },
          },
        },
      },
    },
  });

  console.log(`Total COMPLETED orders: ${orders.length}`);
  let handledByStaffCount = 0;
  let serviceItemsCount = 0;

  for (const order of orders) {
    if (order.handledByStaff) {
      handledByStaffCount++;
    }
    for (const item of order.items) {
      if (item.product.service) {
        serviceItemsCount++;
      }
    }
  }

  console.log(`Orders handled by staff: ${handledByStaffCount}`);
  console.log(`Service items in orders: ${serviceItemsCount}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
