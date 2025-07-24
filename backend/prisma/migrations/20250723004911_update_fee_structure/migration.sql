/*
  Warnings:

  - You are about to drop the column `bookingFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `feeBearer` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `rawPaymentGatewayResponse` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Expense` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_outletId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "bookingFee",
DROP COLUMN "platformFee",
ADD COLUMN     "appFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "midtransFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "fee",
DROP COLUMN "feeBearer",
DROP COLUMN "rawPaymentGatewayResponse";

-- DropTable
DROP TABLE "Expense";

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "outletId" TEXT NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
