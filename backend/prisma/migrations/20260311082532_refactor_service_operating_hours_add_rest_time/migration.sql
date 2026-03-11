/*
  Warnings:

  - You are about to drop the column `fridayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `fridayOpen` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `mondayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `mondayOpen` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `saturdayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `saturdayOpen` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `sundayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `sundayOpen` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `thursdayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `thursdayOpen` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `tuesdayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `tuesdayOpen` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `wednesdayClose` on the `ProductService` table. All the data in the column will be lost.
  - You are about to drop the column `wednesdayOpen` on the `ProductService` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('UPLOAD', 'EMBED');

-- AlterTable
ALTER TABLE "OutletOperatingHours" ADD COLUMN     "isRestEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restEndTime" TIMESTAMP(3),
ADD COLUMN     "restStartTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductService" DROP COLUMN "fridayClose",
DROP COLUMN "fridayOpen",
DROP COLUMN "mondayClose",
DROP COLUMN "mondayOpen",
DROP COLUMN "saturdayClose",
DROP COLUMN "saturdayOpen",
DROP COLUMN "sundayClose",
DROP COLUMN "sundayOpen",
DROP COLUMN "thursdayClose",
DROP COLUMN "thursdayOpen",
DROP COLUMN "tuesdayClose",
DROP COLUMN "tuesdayOpen",
DROP COLUMN "wednesdayClose",
DROP COLUMN "wednesdayOpen";

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "source" "MediaSource" NOT NULL DEFAULT 'UPLOAD',
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOperatingHours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isRestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "restStartTime" TIMESTAMP(3),
    "restEndTime" TIMESTAMP(3),
    "productServiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOperatingHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMedia_productId_order_idx" ON "ProductMedia"("productId", "order");

-- CreateIndex
CREATE INDEX "ServiceOperatingHours_productServiceId_idx" ON "ServiceOperatingHours"("productServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOperatingHours_productServiceId_dayOfWeek_key" ON "ServiceOperatingHours"("productServiceId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOperatingHours" ADD CONSTRAINT "ServiceOperatingHours_productServiceId_fkey" FOREIGN KEY ("productServiceId") REFERENCES "ProductService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
