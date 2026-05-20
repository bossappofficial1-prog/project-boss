-- Create ProductCategory table
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- Add categoryId column to Product
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- Create indexes and constraints
CREATE UNIQUE INDEX "ProductCategory_name_outletId_key" ON "ProductCategory"("name", "outletId");
CREATE INDEX "ProductCategory_outletId_idx" ON "ProductCategory"("outletId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- Add foreign keys
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
