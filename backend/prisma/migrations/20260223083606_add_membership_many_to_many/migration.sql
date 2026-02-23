-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "guestCustomerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_guestCustomerId_idx" ON "Membership"("guestCustomerId");

-- CreateIndex
CREATE INDEX "Membership_orderId_idx" ON "Membership"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_guestCustomerId_orderId_key" ON "Membership"("guestCustomerId", "orderId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_guestCustomerId_fkey" FOREIGN KEY ("guestCustomerId") REFERENCES "GuestCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
