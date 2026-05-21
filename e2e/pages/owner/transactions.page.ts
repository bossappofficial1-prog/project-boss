import { Page, expect } from "@playwright/test";

export class TransactionsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/owner/transactions");
    await this.page.waitForLoadState("networkidle");
  }

  get summaryCard() {
    return this.page.locator("[data-guide='transactions-summary']");
  }

  get tableWrapper() {
    return this.page.locator("[data-guide='transactions-table']");
  }

  get searchInput() {
    return this.page.locator("input[placeholder='Cari transaksi (ID, Deskripsi)...']");
  }

  get exportPdfButton() {
    return this.page.locator("button:has-text('Export PDF')");
  }

  get typeFilter() {
    return this.page.locator('select:below(:text("Tipe")), [data-testid="type-filter"]').first();
  }

  async expectSummaryVisible() {
    await expect(this.summaryCard).toBeVisible({ timeout: 10000 });
    await expect(this.summaryCard.locator("text=Pemasukan")).toBeVisible();
    await expect(this.summaryCard.locator("text=Pengeluaran")).toBeVisible();
    await expect(this.summaryCard.locator("text=Saldo Bersih")).toBeVisible();
  }

  async expectTableVisible() {
    await expect(this.tableWrapper).toBeVisible({ timeout: 10000 });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(600);
  }

  async clickExportPdf() {
    await this.exportPdfButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectTypeFilter(type: string) {
    const trigger = this.page.locator("text=Tipe").first().locator("..");
    await trigger.click();
    await this.page.locator(`[role='option']:has-text("${type}")`).click();
    await this.page.waitForTimeout(300);
  }

  async expectTransactionVisible(description: string) {
    const table = this.tableWrapper.locator('[role="region"]');
    await expect(table.locator(`text=${description}`).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async expectTotalTransactions(count: number) {
    const cell = this.page.locator(`text=${count}`).first();
    await expect(cell).toBeVisible({ timeout: 5000 });
  }
}
