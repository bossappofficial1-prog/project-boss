/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[midtransTransactionToken]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILURE', 'REFUNDED', 'CHALLENGE', 'CANCELLED_BY_SYSTEM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OrderQueueStatus" AS ENUM ('CREATED', 'AWAITING_PAYMENT', 'IN_QUEUE', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED_PROCESSING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FeeBearer" AS ENUM ('CUSTOMER', 'OWNER');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "defaultTransactionFeeBearer" "FeeBearer" NOT NULL DEFAULT 'OWNER';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
ADD COLUMN     "midtransRedirectUrl" TEXT,
ADD COLUMN     "midtransTransactionDetails" JSONB,
ADD COLUMN     "midtransTransactionToken" TEXT,
ADD COLUMN     "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "queueStatus" "OrderQueueStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT';

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Order_midtransTransactionToken_key" ON "Order"("midtransTransactionToken");
