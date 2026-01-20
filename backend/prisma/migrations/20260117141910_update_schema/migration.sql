/*
  Warnings:

  - You are about to drop the column `manualAccountHolder` on the `Outlet` table. All the data in the column will be lost.
  - You are about to drop the column `manualBankAccount` on the `Outlet` table. All the data in the column will be lost.
  - You are about to drop the column `manualBankName` on the `Outlet` table. All the data in the column will be lost.
  - You are about to drop the column `manualPaymentNote` on the `Outlet` table. All the data in the column will be lost.
  - You are about to drop the `Membership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceCapacity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Withdrawal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_guestCustomerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceCapacity" DROP CONSTRAINT "ServiceCapacity_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Wallet" DROP CONSTRAINT "Wallet_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Withdrawal" DROP CONSTRAINT "Withdrawal_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Withdrawal" DROP CONSTRAINT "Withdrawal_processedById_fkey";

-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "manualQrImageUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Outlet" DROP COLUMN "manualAccountHolder",
DROP COLUMN "manualBankAccount",
DROP COLUMN "manualBankName",
DROP COLUMN "manualPaymentNote",
ALTER COLUMN "image" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."Membership";

-- DropTable
DROP TABLE "public"."ServiceCapacity";

-- DropTable
DROP TABLE "public"."Wallet";

-- DropTable
DROP TABLE "public"."Withdrawal";
