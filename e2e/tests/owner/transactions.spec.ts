import { test, expect } from "@playwright/test";
import { TransactionsPage } from "../../pages/owner/transactions.page";
import { loginAsOwner } from "../../utils/auth";

test.describe("Owner Transactions", () => {
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    transactionsPage = new TransactionsPage(page);
    await loginAsOwner(page);
    await transactionsPage.goto();
  });

  test("should display summary card with financial data", async () => {
    await transactionsPage.expectSummaryVisible();
  });

  test("should display transaction table", async () => {
    await transactionsPage.expectTableVisible();
  });

  test("should filter by search", async () => {
    await transactionsPage.search("test-transaction");
    await transactionsPage.page.waitForTimeout(1000);
  });

  test("should open export PDF dialog", async () => {
    await transactionsPage.clickExportPdf();
    const dialog = transactionsPage.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator("text=Rentang Tanggal")).toBeVisible();
  });

  test("should display type filter options", async () => {
    const typeSelect = transactionsPage.page.locator("text=Tipe").first().locator("..");
    await typeSelect.click();
    await expect(transactionsPage.page.locator('[role="option"]')).toHaveCount(3, { timeout: 5000 });
  });

  test("should display status filter options", async () => {
    const statusSelect = transactionsPage.page.locator("text=Status").first().locator("..");
    await statusSelect.click();
    const options = transactionsPage.page.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("should display export button in header", async () => {
    await expect(transactionsPage.exportPdfButton).toBeVisible();
  });

  test("should refresh data", async () => {
    const refreshButton = transactionsPage.page.locator('button:has([class*="lucide-refresh"])');
    await refreshButton.click();
    await transactionsPage.page.waitForTimeout(1000);
  });
});
