/*
  Warnings:

  - You are about to drop the `ProductImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- AlterTable
ALTER TABLE "Outlet" ALTER COLUMN "image" SET DEFAULT '/defaults/default-outlet-image.webp';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "image" TEXT DEFAULT '/defaults/default-product-image.png';

-- DropTable
DROP TABLE "ProductImage";
