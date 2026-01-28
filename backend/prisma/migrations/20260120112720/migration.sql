/*
  Warnings:

  - You are about to drop the column `productId` on the `BookingSlot` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `BookingSlot` table. All the data in the column will be lost.
  - You are about to drop the column `defaultTransactionFeeBearer` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `manualQrImageUrl` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `assignedStaffId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `chargedTo` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `promoId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `serviceDurationMinutes` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `transactionFeeBearer` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the `Promo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productServiceId` to the `BookingSlot` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `Staff` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN');

-- DropForeignKey
ALTER TABLE "BookingSlot" DROP CONSTRAINT "BookingSlot_productId_fkey";

-- DropForeignKey
ALTER TABLE "BookingSlot" DROP CONSTRAINT "BookingSlot_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_assignedStaffId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_promoId_fkey";

-- DropForeignKey
ALTER TABLE "Promo" DROP CONSTRAINT "Promo_businessId_fkey";

-- DropIndex
DROP INDEX "BookingSlot_productId_idx";

-- DropIndex
DROP INDEX "BookingSlot_staffId_idx";

-- DropIndex
DROP INDEX "Order_assignedStaffId_idx";

-- AlterTable
ALTER TABLE "BookingSlot" DROP COLUMN "productId",
DROP COLUMN "staffId",
ADD COLUMN     "productServiceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "defaultTransactionFeeBearer",
DROP COLUMN "manualQrImageUrl",
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "assignedStaffId",
DROP COLUMN "chargedTo",
DROP COLUMN "discountAmount",
DROP COLUMN "promoId",
ADD COLUMN     "handledByStaffId" TEXT;

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "manualAccountHolder" TEXT,
ADD COLUMN     "manualBankAccount" TEXT,
ADD COLUMN     "manualBankName" TEXT,
ADD COLUMN     "manualPaymentNote" TEXT,
ALTER COLUMN "image" SET DEFAULT '/defaults/default-product-image.webp';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "costPrice",
DROP COLUMN "image",
DROP COLUMN "price",
DROP COLUMN "quantity",
DROP COLUMN "serviceDurationMinutes",
DROP COLUMN "transactionFeeBearer",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "address",
DROP COLUMN "notes",
DROP COLUMN "role",
ALTER COLUMN "password" SET NOT NULL;

-- DropTable
DROP TABLE "Promo";

-- DropEnum
DROP TYPE "FeeBearer";

-- DropEnum
DROP TYPE "MemberType";

-- DropEnum
DROP TYPE "PromoStatus";

-- DropEnum
DROP TYPE "PromoType";

-- DropEnum
DROP TYPE "StaffRole";

-- DropEnum
DROP TYPE "WithdrawalStatus";

-- CreateTable
CREATE TABLE "ProductGoods" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER,
    "unit" TEXT NOT NULL,
    "averageHpp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLog" (
    "id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "hppPerUnit" DOUBLE PRECISION,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "productGoodsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductService" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerPhone" TEXT,
    "providerEmail" TEXT,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxParallel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductGoods_productId_key" ON "ProductGoods"("productId");

-- CreateIndex
CREATE INDEX "ProductGoods_productId_idx" ON "ProductGoods"("productId");

-- CreateIndex
CREATE INDEX "ProductGoods_currentStock_idx" ON "ProductGoods"("currentStock");

-- CreateIndex
CREATE INDEX "StockLog_productGoodsId_idx" ON "StockLog"("productGoodsId");

-- CreateIndex
CREATE INDEX "StockLog_type_idx" ON "StockLog"("type");

-- CreateIndex
CREATE INDEX "StockLog_createdAt_idx" ON "StockLog"("createdAt");

-- CreateIndex
CREATE INDEX "StockLog_referenceType_referenceId_idx" ON "StockLog"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductService_productId_key" ON "ProductService"("productId");

-- CreateIndex
CREATE INDEX "ProductService_productId_idx" ON "ProductService"("productId");

-- CreateIndex
CREATE INDEX "ProductService_providerName_idx" ON "ProductService"("providerName");

-- CreateIndex
CREATE INDEX "ProductImage_productId_order_idx" ON "ProductImage"("productId", "order");

-- CreateIndex
CREATE INDEX "BookingSlot_productServiceId_idx" ON "BookingSlot"("productServiceId");

-- CreateIndex
CREATE INDEX "BookingSlot_status_idx" ON "BookingSlot"("status");

-- CreateIndex
CREATE INDEX "Business_subscriptionStatus_idx" ON "Business"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "Order_handledByStaffId_idx" ON "Order"("handledByStaffId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "expenses_outletId_idx" ON "expenses"("outletId");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- AddForeignKey
ALTER TABLE "ProductGoods" ADD CONSTRAINT "ProductGoods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_productGoodsId_fkey" FOREIGN KEY ("productGoodsId") REFERENCES "ProductGoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductService" ADD CONSTRAINT "ProductService_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_handledByStaffId_fkey" FOREIGN KEY ("handledByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
