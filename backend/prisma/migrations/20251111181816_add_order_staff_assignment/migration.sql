-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "assignedStaffId" TEXT;

-- CreateIndex
CREATE INDEX "Order_assignedStaffId_idx" ON "public"."Order"("assignedStaffId");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
