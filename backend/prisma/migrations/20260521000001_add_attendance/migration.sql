-- Create Attendance table
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOut" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "clockInLat" DOUBLE PRECISION,
    "clockInLng" DOUBLE PRECISION,
    "clockOutLat" DOUBLE PRECISION,
    "clockOutLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one attendance per staff per day
CREATE UNIQUE INDEX "Attendance_staffId_date_key" ON "Attendance"("staffId", "date");
CREATE INDEX "Attendance_outletId_date_idx" ON "Attendance"("outletId", "date");

-- Foreign keys
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
