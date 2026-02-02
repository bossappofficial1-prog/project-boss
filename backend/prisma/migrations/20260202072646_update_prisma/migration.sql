/*
  Warnings:

  - A unique constraint covering the columns `[currentSubscriptionId]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIAL';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'AWAITING_PAYMENT';

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "currentSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSubscription" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "paymentUrl" TEXT,
    "externalId" TEXT,
    "proofImage" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "businessId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "BusinessSubscription_businessId_idx" ON "BusinessSubscription"("businessId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_endDate_idx" ON "BusinessSubscription"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_invoiceNumber_key" ON "SubscriptionInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_createdAt_idx" ON "SubscriptionInvoice"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Business_currentSubscriptionId_key" ON "Business"("currentSubscriptionId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_currentSubscriptionId_fkey" FOREIGN KEY ("currentSubscriptionId") REFERENCES "BusinessSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BusinessSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
