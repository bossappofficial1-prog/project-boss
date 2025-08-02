-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT false;
