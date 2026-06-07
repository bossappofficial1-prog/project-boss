-- AlterEnum
ALTER TYPE "StaffPrivilegeType" ADD VALUE 'ATTENDANCE_MANAGEMENT';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "clockInFaceUrl" TEXT,
ADD COLUMN     "clockOutFaceUrl" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "faceDescriptor" TEXT,
ADD COLUMN     "faceImageUrl" TEXT;
