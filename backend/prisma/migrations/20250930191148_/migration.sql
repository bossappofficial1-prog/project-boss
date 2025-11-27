-- CreateEnum
CREATE TYPE "public"."ManualPaymentType" AS ENUM ('QRIS_OFFLINE', 'OWNER_TRANSFER');

-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'AWAITING_VERIFICATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PROOF_SUBMITTED';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'AWAITING_VERIFICATION';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'REJECTED_MANUAL';

-- AlterTable
ALTER TABLE "public"."Outlet" ADD COLUMN     "manualAccountHolder" TEXT,
ADD COLUMN     "manualBankAccount" TEXT,
ADD COLUMN     "manualBankName" TEXT,
ADD COLUMN     "manualPaymentNote" TEXT,
ADD COLUMN     "manualQrImageUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manualMethod" "public"."ManualPaymentType",
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "proofUploadedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT,
ALTER COLUMN "externalId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "public"."Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_isManual_status_idx" ON "public"."Transaction"("isManual", "status");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
