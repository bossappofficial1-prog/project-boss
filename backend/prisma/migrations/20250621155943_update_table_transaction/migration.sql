-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "adminFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "feePaidBy" TEXT;
