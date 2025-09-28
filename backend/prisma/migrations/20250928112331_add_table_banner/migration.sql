-- CreateTable
CREATE TABLE "public"."Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "ctaType" TEXT NOT NULL DEFAULT 'url',
    "ctaPayload" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_businessId_idx" ON "public"."Banner"("businessId");

-- CreateIndex
CREATE INDEX "Banner_isActive_sortOrder_idx" ON "public"."Banner"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "public"."Banner" ADD CONSTRAINT "Banner_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
