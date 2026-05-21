import { test, expect } from "@playwright/test";
import { ProductsPage } from "../../pages/owner/products.page";
import { loginAsOwner } from "../../utils/auth";

test.describe("Owner Products", () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page);
    await loginAsOwner(page);
    await productsPage.goto();
  });

  test("should display products page with overview cards", async () => {
    await productsPage.expectOverviewVisible();
    await productsPage.expectTableVisible();
  });

  test("should display header with add button", async () => {
    await expect(productsPage.addButton).toBeVisible();
    await expect(productsPage.addButton).toBeEnabled({ timeout: 5000 });
  });

  test("should open add product modal", async () => {
    await productsPage.clickAdd();
    const modal = productsPage.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test("should switch between tabs", async () => {
    if (await productsPage.page.locator("[data-slot='tabs-trigger'][value='goods']").isVisible()) {
      await productsPage.switchToTab("goods");
      await expect(productsPage.page.locator('[data-slot="tabs-content"][data-state="active"]')).toBeVisible();
    }
    if (await productsPage.page.locator("[data-slot='tabs-trigger'][value='categories']").isVisible()) {
      await productsPage.switchToTab("categories");
      await expect(productsPage.page.locator("text=Kategori")).toBeVisible({ timeout: 5000 });
    }
  });

  test("should filter products by search", async () => {
    await productsPage.search("produk tidak ada");
    await productsPage.page.waitForTimeout(1000);
    const table = productsPage.tabs.locator('[role="region"]');
    const rows = table.locator('[role="row"]');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test("should display categories tab", async () => {
    await productsPage.switchToTab("categories");
    const categoriesContent = productsPage.page.locator('[data-slot="tabs-content"][data-state="active"]');
    await expect(categoriesContent).toBeVisible({ timeout: 5000 });
  });
});
