/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Outlet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug");

-- CreateIndex
CREATE INDEX "Outlet_slug_idx" ON "Outlet"("slug");
