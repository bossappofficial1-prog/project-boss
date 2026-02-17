-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'TICKET';

-- CreateTable
CREATE TABLE "ProductTicket" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventEndDate" TIMESTAMP(3),
    "venue" TEXT NOT NULL,
    "venueAddress" TEXT,
    "mapUrl" TEXT,
    "totalQuota" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 5,
    "saleStartDate" TIMESTAMP(3),
    "saleEndDate" TIMESTAMP(3),
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTicket_productId_key" ON "ProductTicket"("productId");

-- CreateIndex
CREATE INDEX "ProductTicket_productId_idx" ON "ProductTicket"("productId");

-- CreateIndex
CREATE INDEX "ProductTicket_eventDate_idx" ON "ProductTicket"("eventDate");

-- CreateIndex
CREATE INDEX "ProductTicket_soldCount_idx" ON "ProductTicket"("soldCount");

-- AddForeignKey
ALTER TABLE "ProductTicket" ADD CONSTRAINT "ProductTicket_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
