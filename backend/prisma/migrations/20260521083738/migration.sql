/*
  Warnings:

  - You are about to drop the column `email` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `printHeight` on the `receiptSetting` table. All the data in the column will be lost.
  - The `printWidth` column on the `receiptSetting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[barcode]` on the table `ProductGoods` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Outlet` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TicketCodeFormat" AS ENUM ('QR_CODE', 'BARCODE_128');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('OPENING_CASH', 'CASH_DROP', 'PAID_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'BILLED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('OPEN', 'BILLED', 'PAID');

-- CreateEnum
CREATE TYPE "LoyaltyPointHistoryType" AS ENUM ('EARN', 'REDEEM', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeleteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('FNB', 'RETAIL', 'EVENT', 'SERVICE', 'CUSTOM');

-- AlterEnum
ALTER TYPE "CustomerType" ADD VALUE 'REGISTERED';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RESERVED';

-- DropIndex
DROP INDEX "Staff_email_idx";

-- DropIndex
DROP INDEX "Staff_email_key";

-- AlterTable
ALTER TABLE "BusinessSubscription" ADD COLUMN     "billingCycle" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "pricePerCycle" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GuestCustomer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billId" TEXT,
ADD COLUMN     "bookingDurationMinutes" INTEGER,
ADD COLUMN     "cashierShiftId" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tableId" TEXT,
ADD COLUMN     "tableNumber" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "commissionAtTimeOfOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "hppAtTimeOfOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "type" "OutletType" NOT NULL DEFAULT 'CUSTOM',
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "taxName" TEXT;

-- AlterTable
ALTER TABLE "ProductGoods" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "ProductTicket" ADD COLUMN     "codeFormat" "TicketCodeFormat" NOT NULL DEFAULT 'QR_CODE',
ADD COLUMN     "designConfig" JSONB;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "email",
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "yearlyDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yearlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cashChange" DOUBLE PRECISION,
ADD COLUMN     "cashReceived" DOUBLE PRECISION,
ADD COLUMN     "cashierShiftId" TEXT;

-- AlterTable
ALTER TABLE "receiptSetting" DROP COLUMN "printHeight",
ADD COLUMN     "autoCut" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "copies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "endFeed" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "headerText" TEXT,
ADD COLUMN     "imageThreshold" INTEGER NOT NULL DEFAULT 180,
ADD COLUMN     "qrContent" TEXT,
ADD COLUMN     "showCashier" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showCustomer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showQR" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "printWidth",
ADD COLUMN     "printWidth" INTEGER NOT NULL DEFAULT 80;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "guestCustomerId" TEXT,
    "userId" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutletTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "outletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutletTransferRequest" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "outletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productGoodsId" TEXT NOT NULL,
    "lastPrice" DOUBLE PRECISION,
    "lastOrderDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashierShift" (
    "id" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "outletId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingCash" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashierShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "shiftId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyConfig" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 1,
    "multiplierAmount" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "minSpending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutletMembership" (
    "id" TEXT NOT NULL,
    "guestCustomerId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSpending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPointHistory" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "guestCustomerId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "LoyaltyPointHistoryType" NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyPointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'OPEN',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDeleteRequest" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "orderId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT,
    "status" "DeleteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TransactionDeleteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_guestCustomerId_idx" ON "PushSubscription"("guestCustomerId");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_staffId_idx" ON "PushSubscription"("staffId");

-- CreateIndex
CREATE INDEX "OutletTable_outletId_idx" ON "OutletTable"("outletId");

-- CreateIndex
CREATE INDEX "OutletTransferRequest_outletId_idx" ON "OutletTransferRequest"("outletId");

-- CreateIndex
CREATE INDEX "OutletTransferRequest_senderId_idx" ON "OutletTransferRequest"("senderId");

-- CreateIndex
CREATE INDEX "OutletTransferRequest_receiverId_idx" ON "OutletTransferRequest"("receiverId");

-- CreateIndex
CREATE INDEX "OutletTransferRequest_status_idx" ON "OutletTransferRequest"("status");

-- CreateIndex
CREATE INDEX "Supplier_outletId_idx" ON "Supplier"("outletId");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_idx" ON "SupplierProduct"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierProduct_productGoodsId_idx" ON "SupplierProduct"("productGoodsId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplierId_productGoodsId_key" ON "SupplierProduct"("supplierId", "productGoodsId");

-- CreateIndex
CREATE INDEX "CashierShift_outletId_status_idx" ON "CashierShift"("outletId", "status");

-- CreateIndex
CREATE INDEX "CashierShift_staffId_status_idx" ON "CashierShift"("staffId", "status");

-- CreateIndex
CREATE INDEX "CashierShift_openedAt_idx" ON "CashierShift"("openedAt");

-- CreateIndex
CREATE INDEX "CashMovement_shiftId_createdAt_idx" ON "CashMovement"("shiftId", "createdAt");

-- CreateIndex
CREATE INDEX "CashMovement_type_idx" ON "CashMovement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyConfig_outletId_key" ON "LoyaltyConfig"("outletId");

-- CreateIndex
CREATE INDEX "OutletMembership_guestCustomerId_idx" ON "OutletMembership"("guestCustomerId");

-- CreateIndex
CREATE INDEX "OutletMembership_outletId_idx" ON "OutletMembership"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "OutletMembership_guestCustomerId_outletId_key" ON "OutletMembership"("guestCustomerId", "outletId");

-- CreateIndex
CREATE INDEX "LoyaltyPointHistory_outletId_guestCustomerId_createdAt_idx" ON "LoyaltyPointHistory"("outletId", "guestCustomerId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyPointHistory_orderId_idx" ON "LoyaltyPointHistory"("orderId");

-- CreateIndex
CREATE INDEX "Bill_tableId_idx" ON "Bill"("tableId");

-- CreateIndex
CREATE INDEX "Bill_outletId_status_idx" ON "Bill"("outletId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDeleteRequest_transactionId_key" ON "TransactionDeleteRequest"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDeleteRequest_orderId_key" ON "TransactionDeleteRequest"("orderId");

-- CreateIndex
CREATE INDEX "TransactionDeleteRequest_outletId_idx" ON "TransactionDeleteRequest"("outletId");

-- CreateIndex
CREATE INDEX "TransactionDeleteRequest_status_idx" ON "TransactionDeleteRequest"("status");

-- CreateIndex
CREATE INDEX "TransactionDeleteRequest_createdAt_idx" ON "TransactionDeleteRequest"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionDeleteRequest_transactionId_idx" ON "TransactionDeleteRequest"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionDeleteRequest_orderId_idx" ON "TransactionDeleteRequest"("orderId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_nextBillingDate_idx" ON "BusinessSubscription"("nextBillingDate");

-- CreateIndex
CREATE INDEX "Order_cashierShiftId_idx" ON "Order"("cashierShiftId");

-- CreateIndex
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");

-- CreateIndex
CREATE INDEX "Order_billId_idx" ON "Order"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductGoods_barcode_key" ON "ProductGoods"("barcode");

-- CreateIndex
CREATE INDEX "ProductGoods_barcode_idx" ON "ProductGoods"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_username_key" ON "Staff"("username");

-- CreateIndex
CREATE INDEX "Staff_username_idx" ON "Staff"("username");

-- CreateIndex
CREATE INDEX "Transaction_cashierShiftId_idx" ON "Transaction"("cashierShiftId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_guestCustomerId_fkey" FOREIGN KEY ("guestCustomerId") REFERENCES "GuestCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletTable" ADD CONSTRAINT "OutletTable_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletTransferRequest" ADD CONSTRAINT "OutletTransferRequest_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletTransferRequest" ADD CONSTRAINT "OutletTransferRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletTransferRequest" ADD CONSTRAINT "OutletTransferRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productGoodsId_fkey" FOREIGN KEY ("productGoodsId") REFERENCES "ProductGoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyConfig" ADD CONSTRAINT "LoyaltyConfig_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletMembership" ADD CONSTRAINT "OutletMembership_guestCustomerId_fkey" FOREIGN KEY ("guestCustomerId") REFERENCES "GuestCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletMembership" ADD CONSTRAINT "OutletMembership_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPointHistory" ADD CONSTRAINT "LoyaltyPointHistory_guestCustomerId_fkey" FOREIGN KEY ("guestCustomerId") REFERENCES "GuestCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPointHistory" ADD CONSTRAINT "LoyaltyPointHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPointHistory" ADD CONSTRAINT "LoyaltyPointHistory_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cashierShiftId_fkey" FOREIGN KEY ("cashierShiftId") REFERENCES "CashierShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "OutletTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "OutletTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cashierShiftId_fkey" FOREIGN KEY ("cashierShiftId") REFERENCES "CashierShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDeleteRequest" ADD CONSTRAINT "TransactionDeleteRequest_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDeleteRequest" ADD CONSTRAINT "TransactionDeleteRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDeleteRequest" ADD CONSTRAINT "TransactionDeleteRequest_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDeleteRequest" ADD CONSTRAINT "TransactionDeleteRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
