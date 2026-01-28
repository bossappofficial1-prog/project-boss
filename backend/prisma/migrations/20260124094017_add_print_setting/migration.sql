-- CreateTable
CREATE TABLE "receiptSetting" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "photoString" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT false,
    "printHeight" TEXT NOT NULL DEFAULT '105',
    "printWidth" TEXT NOT NULL DEFAULT '80',

    CONSTRAINT "receiptSetting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receiptSetting" ADD CONSTRAINT "receiptSetting_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
