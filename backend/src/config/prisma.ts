import { PrismaClient } from "@prisma/client";

// For Prisma 7, if using a direct database connection:
// You need to install @prisma/adapter-pg (for PostgreSQL) and pass the adapter
// OR use accelerateUrl for Prisma Accelerate
//
// Option 1: Direct connection (requires @prisma/adapter-pg and pg packages)
// import { PrismaPg } from '@prisma/adapter-pg'
// import { Pool } from 'pg'
// const pool = new Pool({ connectionString: process.env.DATABASE_URL })
// const adapter = new PrismaPg(pool)
// export const db = new PrismaClient({ adapter })
//
// Option 2: Using Prisma Accelerate (simpler for now)
export const db = new PrismaClient({
  // If you have Prisma Accelerate, use:
  // accelerateUrl: process.env.DATABASE_URL,
  // For now, without additional packages, we can use the default behavior
  // The connection is configured via prisma.config.ts for migrations
});
