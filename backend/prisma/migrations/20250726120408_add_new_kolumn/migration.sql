/*
  Warnings:

  - A unique constraint covering the columns `[midtransReference]` on the table `Withdrawal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "WithdrawalStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "midtransReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_midtransReference_key" ON "Withdrawal"("midtransReference");
