-- DropForeignKey
ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT "SubscriptionInvoice_businessId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "receiptSetting" DROP CONSTRAINT "receiptSetting_outletId_fkey";

-- AlterTable
ALTER TABLE "SubscriptionInvoice" ALTER COLUMN "businessId" DROP NOT NULL,
ALTER COLUMN "subscriptionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BusinessSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiptSetting" ADD CONSTRAINT "receiptSetting_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
