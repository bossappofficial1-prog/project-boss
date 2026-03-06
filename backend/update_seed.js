const fs = require("fs");
const file = "c:\\Data\\Projects\\Project_BOSS\\project-boss\\backend\\prisma\\db\\seed.ts";
let content = fs.readFileSync(file, "utf8");

if (!content.includes("DatabaseFactory")) {
  content = "import { DatabaseFactory } from './factories';\n" + content;
}

const cleanupMarker = "await prisma.transaction.deleteMany({});";
if (content.includes(cleanupMarker) && !content.includes("prisma.expense.deleteMany")) {
  content = content.replace(
    cleanupMarker,
    "await prisma.expense.deleteMany({});\n    " + cleanupMarker,
  );
}

const startMarker = "// --- 5. Create Products ---";
const endMarker = "await seedOutletTransactions(outlets, outletProductCatalog);";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `// --- 5. Create Products, Transactions, and Expenses using Factory ---
  console.log("📦 Generating mass dummy data for reports using Laravel-style Factories...");
  
  const factory = new DatabaseFactory(prisma);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // Data dummy untuk 6 bulan terakhir
  const endDate = new Date();

  for (let i = 0; i < outlets.length; i++) {
    const outlet = outlets[i];
    console.log(\`Generating data for outlet: \${outlet.name}\`);
    
    // Generate 30 produk per outlet
    const products = await factory.createDummyProducts(outlet.id, 30);
    
    // Generate 150 transaksi per outlet selama 6 bulan terakhir
    await factory.createDummyTransactions(outlet.id, products, 150, startDate, endDate);
    
    // Generate 50 pengeluaran per outlet selama 6 bulan terakhir
    await factory.createDummyExpenses(outlet.id, 50, startDate, endDate);
  }
  
  console.log("✅ Mass dummy data generation for reports completed.");`;

  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log("Successfully updated seed.ts");
} else {
  console.log("Failed to find markers");
}
