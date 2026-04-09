import hbs from "handlebars";
import fs from "fs-extra";
import path from "path";

// Register helpers if not already registered (idempotent)
if (!hbs.helpers.formatRupiah) {
  hbs.registerHelper("formatRupiah", (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
    }).format(value);
  });
}

if (!hbs.helpers.rowNumber) {
  hbs.registerHelper("rowNumber", (index: number) => {
    return index + 1;
  });
}

export const generateReceiptHtml = async (data: any) => {
  const templatePath = path.join(process.cwd(), "templates", "receipt.hbs");
  const templateSource = await fs.readFile(templatePath, "utf-8");
  const template = hbs.compile(templateSource);

  return template(data);
};