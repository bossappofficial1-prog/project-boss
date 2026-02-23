/*
  Warnings:

  - You are about to drop the column `note` on the `Membership` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "note",
ADD COLUMN     "point" INTEGER NOT NULL DEFAULT 0;
