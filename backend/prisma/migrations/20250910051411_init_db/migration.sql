-- CreateIndex
CREATE INDEX "Business_description_idx" ON "Business"("description");

-- CreateIndex
CREATE INDEX "Outlet_latitude_longitude_idx" ON "Outlet"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Outlet_name_idx" ON "Outlet"("name");
