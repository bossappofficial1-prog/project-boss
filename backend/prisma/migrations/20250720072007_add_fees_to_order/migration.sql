/*
  Warnings:

  - You are about to drop the column `bookingFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "bookingFee",
DROP COLUMN "platformFee";
