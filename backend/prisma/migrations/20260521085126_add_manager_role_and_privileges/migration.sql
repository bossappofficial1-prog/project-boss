-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('CASHIER', 'MANAGER');

-- CreateEnum
CREATE TYPE "StaffPrivilegeType" AS ENUM ('OUTLET_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'TRANSACTION_VIEW', 'TRANSACTION_DELETE');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "email" TEXT,
ADD COLUMN     "pin" TEXT,
ADD COLUMN     "role" "StaffRole" NOT NULL DEFAULT 'CASHIER';

-- AlterTable
ALTER TABLE "TransactionDeleteRequest" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "approvedByRole" TEXT;

-- CreateTable
CREATE TABLE "StaffPrivilege" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "privilege" "StaffPrivilegeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffPrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffPrivilege_staffId_idx" ON "StaffPrivilege"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPrivilege_staffId_privilege_key" ON "StaffPrivilege"("staffId", "privilege");

-- CreateIndex
CREATE INDEX "Staff_role_idx" ON "Staff"("role");

-- CreateIndex
CREATE INDEX "Staff_name_idx" ON "Staff"("name");

-- AddForeignKey
ALTER TABLE "StaffPrivilege" ADD CONSTRAINT "StaffPrivilege_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
