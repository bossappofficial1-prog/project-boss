-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE INDEX "Outlet_description_idx" ON "Outlet"("description");
