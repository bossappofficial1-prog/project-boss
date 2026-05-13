-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "taxPercentage" DOUBLE PRECISION;
