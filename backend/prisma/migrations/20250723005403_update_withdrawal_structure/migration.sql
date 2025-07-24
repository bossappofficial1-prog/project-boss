/*
  Warnings:

  - You are about to drop the column `amount` on the `Withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `applicationFee` on the `Withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `bankTransferFee` on the `Withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `walletId` on the `Withdrawal` table. All the data in the column will be lost.
  - Added the required column `appFee` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finalAmount` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedAmount` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_walletId_fkey";

-- DropIndex
DROP INDEX "Withdrawal_walletId_idx";

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "amount",
DROP COLUMN "applicationFee",
DROP COLUMN "bankTransferFee",
DROP COLUMN "walletId",
ADD COLUMN     "appFee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "finalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "midtransFee" DOUBLE PRECISION NOT NULL DEFAULT 4000,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "requestedAmount" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "Withdrawal_businessId_idx" ON "Withdrawal"("businessId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
