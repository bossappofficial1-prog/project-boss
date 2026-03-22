/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Outlet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('UPLOAD', 'EMBED');

-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "receiptUrl" TEXT;

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

-- CreateIndex
CREATE INDEX "ProductMedia_productId_order_idx" ON "ProductMedia"("productId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_email_key" ON "Outlet"("email");

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
