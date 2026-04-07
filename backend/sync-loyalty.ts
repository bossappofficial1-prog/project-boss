import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.outletMembership.findMany({
    include: {
      guestCustomer: true,
    },
  });

  console.log(`Found ${members.length} members to sync.`);

  for (const member of members) {
    const orders = await prisma.order.findMany({
      where: {
        guestCustomerId: member.guestCustomerId,
        outletId: member.outletId,
        orderStatus: 'COMPLETED',
      },
    });

    const totalSpending = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    console.log(`Syncing member ${member.guestCustomer.phone}: Total Spending = ${totalSpending}`);

    await prisma.outletMembership.update({
      where: { id: member.id },
      data: { totalSpending },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
