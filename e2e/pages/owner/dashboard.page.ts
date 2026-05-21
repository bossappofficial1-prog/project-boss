import { Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/owner");
    await this.page.waitForLoadState("networkidle");
  }

  get statsCards() {
    return this.page.locator("[data-guide='dashboard-stats']");
  }

  get businessProfile() {
    return this.page.locator("[data-guide='dashboard-business']");
  }

  get outletsSection() {
    return this.page.locator("[data-guide='dashboard-outlets']");
  }

  async expectStatsVisible() {
    await expect(this.statsCards).toBeVisible({ timeout: 10000 });
    const cards = this.statsCards.locator(".grid > div, .gap-4 > div");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  }

  async expectOutletsVisible() {
    await expect(this.outletsSection).toBeVisible({ timeout: 10000 });
  }

  async expectBusinessProfileVisible() {
    await expect(this.businessProfile).toBeVisible({ timeout: 10000 });
  }

  async clickAddOutlet() {
    await this.outletsSection.locator('button:has-text("Tambah")').click();
    await this.page.waitForTimeout(500);
  }

  async clickEditOutlet(outletName: string) {
    const card = this.outletsSection.locator(`text=${outletName}`).first();
    await card.locator("..").locator('button[aria-label="Edit"]').click();
    await this.page.waitForTimeout(500);
  }

  async toggleOutletStatus(outletName: string) {
    const card = this.outletsSection.locator(`text=${outletName}`).first();
    await card.locator("..").locator('[role="switch"]').click();
  }
}
