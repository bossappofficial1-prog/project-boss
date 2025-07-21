/*
  Warnings:

  - You are about to drop the column `email` on the `Outlet` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[midtransTransactionToken]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "midtransRedirectUrl" TEXT,
ADD COLUMN     "midtransTransactionToken" TEXT;

-- AlterTable
ALTER TABLE "Outlet" DROP COLUMN "email";

-- CreateIndex
CREATE UNIQUE INDEX "Order_midtransTransactionToken_key" ON "Order"("midtransTransactionToken");
