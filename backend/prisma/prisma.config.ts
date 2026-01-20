// Prisma 7 configuration for migrations
// This file specifies the database URL used during "prisma migrate"
export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "",
    },
  },
};
