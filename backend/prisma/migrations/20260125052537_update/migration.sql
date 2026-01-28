/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `GuestCustomer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[outletId]` on the table `receiptSetting` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phone` on table `GuestCustomer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GuestCustomer" ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GuestCustomer_phone_key" ON "GuestCustomer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "receiptSetting_outletId_key" ON "receiptSetting"("outletId");
