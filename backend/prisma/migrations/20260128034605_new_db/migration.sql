/*
  Warnings:

  - You are about to drop the column `productId` on the `BookingSlot` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `BookingSlot` table. All the data in the column will be lost.
  - You are about to drop the column `defaultTransactionFeeBearer` on the `Business` table. All the data in the column will be lost.
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
  - You are about to drop the `Membership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Promo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceCapacity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Withdrawal` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productServiceId` to the `BookingSlot` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `Staff` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN');

-- DropForeignKey
ALTER TABLE "public"."BookingSlot" DROP CONSTRAINT "BookingSlot_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BookingSlot" DROP CONSTRAINT "BookingSlot_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_guestCustomerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_assignedStaffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_promoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Promo" DROP CONSTRAINT "Promo_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceCapacity" DROP CONSTRAINT "ServiceCapacity_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Wallet" DROP CONSTRAINT "Wallet_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Withdrawal" DROP CONSTRAINT "Withdrawal_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Withdrawal" DROP CONSTRAINT "Withdrawal_processedById_fkey";

-- DropIndex
DROP INDEX "public"."BookingSlot_productId_idx";

-- DropIndex
DROP INDEX "public"."BookingSlot_staffId_idx";

-- DropIndex
DROP INDEX "public"."Order_assignedStaffId_idx";

-- AlterTable
ALTER TABLE "public"."BookingSlot" DROP COLUMN "productId",
DROP COLUMN "staffId",
ADD COLUMN     "productServiceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Business" DROP COLUMN "defaultTransactionFeeBearer",
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "assignedStaffId",
DROP COLUMN "chargedTo",
DROP COLUMN "discountAmount",
DROP COLUMN "promoId",
ADD COLUMN     "handledByStaffId" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "costPrice",
DROP COLUMN "image",
DROP COLUMN "price",
DROP COLUMN "quantity",
DROP COLUMN "serviceDurationMinutes",
DROP COLUMN "transactionFeeBearer",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "public"."Staff" DROP COLUMN "address",
DROP COLUMN "notes",
DROP COLUMN "role",
ALTER COLUMN "password" SET NOT NULL;

-- DropTable
DROP TABLE "public"."Membership";

-- DropTable
DROP TABLE "public"."Promo";

-- DropTable
DROP TABLE "public"."ServiceCapacity";

-- DropTable
DROP TABLE "public"."Wallet";

-- DropTable
DROP TABLE "public"."Withdrawal";

-- DropEnum
DROP TYPE "public"."FeeBearer";

-- DropEnum
DROP TYPE "public"."MemberType";

-- DropEnum
DROP TYPE "public"."PromoStatus";

-- DropEnum
DROP TYPE "public"."PromoType";

-- DropEnum
DROP TYPE "public"."StaffRole";

-- DropEnum
DROP TYPE "public"."WithdrawalStatus";

-- CreateTable
CREATE TABLE "public"."ProductGoods" (
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
CREATE TABLE "public"."StockLog" (
    "id" TEXT NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
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
CREATE TABLE "public"."ProductService" (
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

-- CreateIndex
CREATE UNIQUE INDEX "ProductGoods_productId_key" ON "public"."ProductGoods"("productId");

-- CreateIndex
CREATE INDEX "ProductGoods_productId_idx" ON "public"."ProductGoods"("productId");

-- CreateIndex
CREATE INDEX "ProductGoods_currentStock_idx" ON "public"."ProductGoods"("currentStock");

-- CreateIndex
CREATE INDEX "StockLog_productGoodsId_idx" ON "public"."StockLog"("productGoodsId");

-- CreateIndex
CREATE INDEX "StockLog_type_idx" ON "public"."StockLog"("type");

-- CreateIndex
CREATE INDEX "StockLog_createdAt_idx" ON "public"."StockLog"("createdAt");

-- CreateIndex
CREATE INDEX "StockLog_referenceType_referenceId_idx" ON "public"."StockLog"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductService_productId_key" ON "public"."ProductService"("productId");

-- CreateIndex
CREATE INDEX "ProductService_productId_idx" ON "public"."ProductService"("productId");

-- CreateIndex
CREATE INDEX "ProductService_providerName_idx" ON "public"."ProductService"("providerName");

-- CreateIndex
CREATE INDEX "BookingSlot_productServiceId_idx" ON "public"."BookingSlot"("productServiceId");

-- CreateIndex
CREATE INDEX "BookingSlot_status_idx" ON "public"."BookingSlot"("status");

-- CreateIndex
CREATE INDEX "Business_subscriptionStatus_idx" ON "public"."Business"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "Order_handledByStaffId_idx" ON "public"."Order"("handledByStaffId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "public"."Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "public"."Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "public"."Product"("type");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "public"."Product"("status");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "public"."Staff"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "expenses_outletId_idx" ON "public"."expenses"("outletId");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "public"."expenses"("date");

-- AddForeignKey
ALTER TABLE "public"."ProductGoods" ADD CONSTRAINT "ProductGoods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_productGoodsId_fkey" FOREIGN KEY ("productGoodsId") REFERENCES "public"."ProductGoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductService" ADD CONSTRAINT "ProductService_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingSlot" ADD CONSTRAINT "BookingSlot_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "public"."ProductService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_handledByStaffId_fkey" FOREIGN KEY ("handledByStaffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
