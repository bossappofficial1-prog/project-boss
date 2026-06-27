-- CreateEnum
CREATE TYPE "PushType" AS ENUM ('WEB', 'EXPO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'BUSINESS_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'BUSINESS_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PLAN_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_PLAN_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_EXTENDED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE 'NOTIFICATION_SENT';

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "expoPushToken" TEXT,
ADD COLUMN     "type" "PushType" NOT NULL DEFAULT 'WEB',
ALTER COLUMN "p256dh" DROP NOT NULL,
ALTER COLUMN "auth" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "backupCodes" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT DEFAULT 'desktop',
    "browser" TEXT,
    "os" TEXT,
    "ip" TEXT,
    "location" TEXT,
    "deviceFingerprint" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_lastActiveAt_idx" ON "UserSession"("userId", "lastActiveAt");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
