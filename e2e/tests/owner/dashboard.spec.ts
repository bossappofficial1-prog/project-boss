import { test, expect } from "@playwright/test";
import { DashboardPage } from "../../pages/owner/dashboard.page";
import { loginAsOwner } from "../../utils/auth";

test.describe("Owner Dashboard", () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await loginAsOwner(page);
    await dashboard.goto();
  });

  test("should display dashboard layout with all sections", async () => {
    await dashboard.expectStatsVisible();
    await dashboard.expectOutletsVisible();
  });

  test("should display stats cards with metrics", async () => {
    await dashboard.expectStatsVisible();
  });

  test("should display outlets section", async () => {
    await dashboard.expectOutletsVisible();
  });

  test("should open add outlet modal", async () => {
    await dashboard.clickAddOutlet();
    const modal = dashboard.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to products page via sidebar", async ({ page }) => {
    await page.locator('[data-sidebar="sidebar"]').locator("text=Produk").click();
    await page.waitForURL("/owner/products", { timeout: 10000 });
    await expect(page.locator("text=Produk & Jasa")).toBeVisible();
  });

  test("should navigate to transactions page via sidebar", async ({ page }) => {
    await page.locator('[data-sidebar="sidebar"]').locator("text=Transaksi").click();
    await page.waitForURL("/owner/transactions", { timeout: 10000 });
    await expect(page.locator("text=Riwayat Transaksi")).toBeVisible();
  });
});
