/*
  Warnings:

  - You are about to drop the column `paidAt` on the `Transaction` table. All the data in the column will be lost.
  - Made the column `externalId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `feeBearer` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "paidAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentUrl" TEXT,
ALTER COLUMN "externalId" SET NOT NULL,
ALTER COLUMN "feeBearer" SET NOT NULL,
ALTER COLUMN "feeBearer" SET DEFAULT 'OWNER';
