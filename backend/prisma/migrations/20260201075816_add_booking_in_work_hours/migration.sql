/*
  Warnings:

  - You are about to drop the column `bookingInWorkDay` on the `ProductService` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductService" DROP COLUMN "bookingInWorkDay",
ADD COLUMN     "bookingInWorkHours" BOOLEAN NOT NULL DEFAULT true;
