-- CreateEnum
CREATE TYPE "TicketCodeStatus" AS ENUM ('VALID', 'REDEEMED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "TicketCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "TicketCodeStatus" NOT NULL DEFAULT 'VALID',
    "orderItemId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketCode_code_key" ON "TicketCode"("code");

-- CreateIndex
CREATE INDEX "TicketCode_code_idx" ON "TicketCode"("code");

-- CreateIndex
CREATE INDEX "TicketCode_orderItemId_idx" ON "TicketCode"("orderItemId");

-- CreateIndex
CREATE INDEX "TicketCode_status_idx" ON "TicketCode"("status");

-- AddForeignKey
ALTER TABLE "TicketCode" ADD CONSTRAINT "TicketCode_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketCode" ADD CONSTRAINT "TicketCode_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
