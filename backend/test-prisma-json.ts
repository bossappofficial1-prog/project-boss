import { db } from "./src/config/prisma";
async function run() {
  const result = await db.$queryRawUnsafe(`SELECT row_to_json(oh.*) as oh FROM "OutletOperatingHours" oh LIMIT 1`);
  console.log("FROM Postgres row_to_json:", result[0].oh.openTime);
  process.exit(0);
}
run();
