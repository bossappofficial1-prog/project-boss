-- CreateEnum
CREATE TYPE "LoyaltyRewardType" AS ENUM ('DISCOUNT_FLAT', 'DISCOUNT_PERCENT', 'FREE_ITEM', 'VOUCHER', 'CASHBACK');

-- CreateEnum
CREATE TYPE "RewardRedemptionStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IngredientStockLogType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'POS_DEDUCTION', 'SPOILAGE');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_CALENDAR', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LoyaltyPointHistoryType" ADD VALUE 'WELCOME_BONUS';
ALTER TYPE "LoyaltyPointHistoryType" ADD VALUE 'BIRTHDAY_BONUS';
ALTER TYPE "LoyaltyPointHistoryType" ADD VALUE 'REWARD_REDEEM';
ALTER TYPE "LoyaltyPointHistoryType" ADD VALUE 'EXPIRY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StaffPrivilegeType" ADD VALUE 'STOCK_MANAGEMENT';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'CUSTOMER_MANAGEMENT';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'ORDER_MANAGEMENT';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'SERVICE_MANAGEMENT';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'FINANCE_REPORTS';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'ANALYTICS';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'TOOLS_CALCULATOR';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'INGREDIENT_MANAGEMENT';
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'RECIPE_MANAGEMENT';

-- AlterTable
ALTER TABLE "BookingSlot" ADD COLUMN     "googleCalendarEventId" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LoyaltyConfig" ADD COLUMN     "autoEnroll" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "expiryDays" INTEGER,
ADD COLUMN     "maxRedeemPercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "minRedeemPoints" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "welcomeBonus" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestCount" INTEGER;

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "qrisString" TEXT;

-- AlterTable
ALTER TABLE "OutletMembership" ADD COLUMN     "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tierId" TEXT;

-- AlterTable
ALTER TABLE "OutletOperatingHours" ADD COLUMN     "breakEnd" TIMESTAMP(3),
ADD COLUMN     "breakStart" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GoodsStockBatch" (
    "id" TEXT NOT NULL,
    "productGoodsId" TEXT NOT NULL,
    "purchaseQuantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "costPerUnit" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsStockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#CD7F32',
    "minLifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "earnMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "benefits" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "type" "LoyaltyRewardType" NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "discountAmount" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "productId" TEXT,
    "voucherValue" DOUBLE PRECISION,
    "cashbackAmount" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT -1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "guestCustomerId" TEXT NOT NULL,
    "loyaltyRewardId" TEXT NOT NULL,
    "orderId" TEXT,
    "pointsUsed" INTEGER NOT NULL,
    "status" "RewardRedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseUnit" TEXT NOT NULL,
    "recipeUnit" TEXT NOT NULL,
    "conversionFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION,
    "outletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientStockBatch" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "purchaseQuantity" DOUBLE PRECISION NOT NULL,
    "remainingQuantity" DOUBLE PRECISION NOT NULL,
    "costPerRecipeUnit" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientStockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientStockLog" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "type" "IngredientStockLogType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "costPerUnit" DOUBLE PRECISION,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientStockLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "totalEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productGoodsId" TEXT,
    "ingredientId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "priceAtOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "senderOutletId" TEXT NOT NULL,
    "receiverOutletId" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'PENDING',
    "shippingDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalItem" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "JournalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "settings" JSONB,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoodsStockBatch_productGoodsId_idx" ON "GoodsStockBatch"("productGoodsId");

-- CreateIndex
CREATE INDEX "GoodsStockBatch_createdAt_idx" ON "GoodsStockBatch"("createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyTier_outletId_idx" ON "LoyaltyTier"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTier_outletId_name_key" ON "LoyaltyTier"("outletId", "name");

-- CreateIndex
CREATE INDEX "LoyaltyReward_outletId_idx" ON "LoyaltyReward"("outletId");

-- CreateIndex
CREATE INDEX "LoyaltyReward_outletId_isActive_idx" ON "LoyaltyReward"("outletId", "isActive");

-- CreateIndex
CREATE INDEX "RewardRedemption_outletId_idx" ON "RewardRedemption"("outletId");

-- CreateIndex
CREATE INDEX "RewardRedemption_guestCustomerId_idx" ON "RewardRedemption"("guestCustomerId");

-- CreateIndex
CREATE INDEX "RewardRedemption_orderId_idx" ON "RewardRedemption"("orderId");

-- CreateIndex
CREATE INDEX "Ingredient_outletId_idx" ON "Ingredient"("outletId");

-- CreateIndex
CREATE INDEX "IngredientStockBatch_ingredientId_idx" ON "IngredientStockBatch"("ingredientId");

-- CreateIndex
CREATE INDEX "IngredientStockBatch_createdAt_idx" ON "IngredientStockBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_productId_key" ON "Recipe"("productId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_key" ON "RecipeIngredient"("recipeId", "ingredientId");

-- CreateIndex
CREATE INDEX "IngredientStockLog_ingredientId_idx" ON "IngredientStockLog"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_outletId_idx" ON "PurchaseOrder"("outletId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_productGoodsId_idx" ON "PurchaseOrderItem"("productGoodsId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_ingredientId_idx" ON "PurchaseOrderItem"("ingredientId");

-- CreateIndex
CREATE INDEX "StockTransfer_businessId_idx" ON "StockTransfer"("businessId");

-- CreateIndex
CREATE INDEX "StockTransfer_senderOutletId_idx" ON "StockTransfer"("senderOutletId");

-- CreateIndex
CREATE INDEX "StockTransfer_receiverOutletId_idx" ON "StockTransfer"("receiverOutletId");

-- CreateIndex
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");

-- CreateIndex
CREATE INDEX "StockTransferItem_stockTransferId_idx" ON "StockTransferItem"("stockTransferId");

-- CreateIndex
CREATE INDEX "StockTransferItem_productId_idx" ON "StockTransferItem"("productId");

-- CreateIndex
CREATE INDEX "Account_businessId_idx" ON "Account"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_businessId_code_key" ON "Account"("businessId", "code");

-- CreateIndex
CREATE INDEX "JournalEntry_businessId_idx" ON "JournalEntry"("businessId");

-- CreateIndex
CREATE INDEX "JournalItem_journalEntryId_idx" ON "JournalItem"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalItem_accountId_idx" ON "JournalItem"("accountId");

-- CreateIndex
CREATE INDEX "Integration_businessId_idx" ON "Integration"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_businessId_provider_key" ON "Integration"("businessId", "provider");

-- CreateIndex
CREATE INDEX "OutletMembership_tierId_idx" ON "OutletMembership"("tierId");

-- AddForeignKey
ALTER TABLE "GoodsStockBatch" ADD CONSTRAINT "GoodsStockBatch_productGoodsId_fkey" FOREIGN KEY ("productGoodsId") REFERENCES "ProductGoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_guestCustomerId_fkey" FOREIGN KEY ("guestCustomerId") REFERENCES "GuestCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_loyaltyRewardId_fkey" FOREIGN KEY ("loyaltyRewardId") REFERENCES "LoyaltyReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletMembership" ADD CONSTRAINT "OutletMembership_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientStockBatch" ADD CONSTRAINT "IngredientStockBatch_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientStockLog" ADD CONSTRAINT "IngredientStockLog_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productGoodsId_fkey" FOREIGN KEY ("productGoodsId") REFERENCES "ProductGoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_senderOutletId_fkey" FOREIGN KEY ("senderOutletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_receiverOutletId_fkey" FOREIGN KEY ("receiverOutletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalItem" ADD CONSTRAINT "JournalItem_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalItem" ADD CONSTRAINT "JournalItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
