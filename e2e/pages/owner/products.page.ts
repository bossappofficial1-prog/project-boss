import { Page, expect } from "@playwright/test";

export class ProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/owner/products");
    await this.page.waitForLoadState("networkidle");
  }

  get header() {
    return this.page.locator("[data-guide='products-header']");
  }

  get overviewCards() {
    return this.page.locator("[data-guide='products-overview']");
  }

  get tabs() {
    return this.page.locator("[data-guide='products-tabs']");
  }

  get searchInput() {
    return this.page.locator("input[placeholder='Cari produk...']");
  }

  get addButton() {
    return this.page.locator("[data-guide='products-header'] button").first();
  }

  get categoriesTab() {
    return this.page.locator("[data-slot='tabs-trigger'][value='categories']");
  }

  async expectOverviewVisible() {
    await expect(this.overviewCards).toBeVisible({ timeout: 10000 });
  }

  async expectTableVisible() {
    await expect(this.tabs).toBeVisible({ timeout: 10000 });
    const table = this.tabs.locator('[role="region"]');
    await expect(table).toBeVisible({ timeout: 5000 });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clickAdd() {
    await this.addButton.click();
    await this.page.waitForTimeout(500);
  }

  async switchToTab(tab: string) {
    await this.tabs.locator(`[data-slot='tabs-trigger'][value='${tab}']`).click();
    await this.page.waitForTimeout(300);
  }

  async expectProductInTable(productName: string) {
    const table = this.tabs.locator('[role="region"]');
    await expect(table.locator(`text=${productName}`).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async expectProductNotInTable(productName: string) {
    const table = this.tabs.locator('[role="region"]');
    await expect(table.locator(`text=${productName}`).first()).not.toBeVisible({
      timeout: 5000,
    });
  }

  async clickEditProduct(productName: string) {
    const row = this.tabs.locator(`text=${productName}`).first().locator("..").locator("..");
    await row.locator('button:has([class*="lucide-pen"])').click();
    await this.page.waitForTimeout(500);
  }

  async clickDeleteProduct(productName: string) {
    const row = this.tabs.locator(`text=${productName}`).first().locator("..").locator("..");
    await row.locator('button:has([class*="lucide-trash"])').click();
    await this.page.waitForTimeout(500);
  }
}
