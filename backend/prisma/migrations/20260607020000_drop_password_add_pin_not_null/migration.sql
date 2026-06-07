-- Drop password column (replaced by pin in schema, no code references it)
ALTER TABLE "Staff" DROP COLUMN "password";

-- Make pin NOT NULL (it's required in the Prisma schema)
ALTER TABLE "Staff" ALTER COLUMN "pin" SET NOT NULL;
