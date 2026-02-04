-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PROOF_SUBMITTED';

-- AlterTable
ALTER TABLE "SubscriptionInvoice" ADD COLUMN     "proofUploadedAt" TIMESTAMP(3);
