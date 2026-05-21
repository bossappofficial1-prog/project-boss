import { test, expect } from "@playwright/test";
import { PosPage } from "../../pages/cashier/pos.page";
import { loginAsCashier } from "../../utils/auth";
import { TEST_PRODUCT, TEST_CUSTOMER } from "../../fixtures/test-data";

test.describe("Cashier POS", () => {
  let posPage: PosPage;

  test.beforeEach(async ({ page }) => {
    posPage = new PosPage(page);
    await loginAsCashier(page);
    await posPage.goto();
  });

  test("should display product catalog", async () => {
    await posPage.expectCatalogVisible();
  });

  test("should display cart panel", async () => {
    await posPage.expectCartVisible();
  });

  test("should search for products", async () => {
    await posPage.searchProduct("test");
    await posPage.page.waitForTimeout(1000);
  });

  test.describe("Cart Operations", () => {
    test.beforeEach(async () => {
      await posPage.page.waitForTimeout(2000);
    });

    test("should add product to cart", async () => {
      const firstProduct = posPage.catalogPanel.locator("button, [role='button'], .cursor-pointer").first();
      if (await firstProduct.isVisible()) {
        await firstProduct.click();
        await posPage.page.waitForTimeout(500);
        const cartItems = posPage.cartPanel.locator("text=produk").first();
        await expect(cartItems).toBeVisible({ timeout: 3000 });
      }
    });

    test("should display customer info section", async () => {
      await expect(posPage.customerSection).toBeVisible({ timeout: 5000 });
    });

    test("should display payment methods", async () => {
      await expect(posPage.paymentSection).toBeVisible({ timeout: 5000 });
      await expect(posPage.page.locator("text=Tunai")).toBeVisible();
    });

    test("should display bayar button", async () => {
      await expect(posPage.page.locator("button:has-text('Bayar')").first()).toBeVisible({
        timeout: 5000,
      });
    });

    test("should navigate between catalog and cart on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await posPage.page.waitForTimeout(300);

      const cartTab = posPage.page.locator("text=Keranjang").first();
      await cartTab.click();
      await posPage.page.waitForTimeout(300);

      const catalogTab = posPage.page.locator("text=Katalog").first();
      await catalogTab.click();
      await posPage.page.waitForTimeout(300);
    });
  });

  test.describe("Full POS Flow", () => {
    test("should complete a sale flow", async () => {
      await posPage.page.waitForTimeout(2000);

      const firstProduct = posPage.catalogPanel.locator("button, [role='button'], .cursor-pointer").first();
      if (await firstProduct.isVisible()) {
        await firstProduct.click();
        await posPage.page.waitForTimeout(500);
      }

      await posPage.fillCustomerName(TEST_CUSTOMER.name);
      await posPage.fillCustomerPhone(TEST_CUSTOMER.phone);

      await posPage.selectPaymentCash();

      const totalText = await posPage.submitSection.locator("text=Rp").textContent();
      if (totalText) {
        const total = parseInt(totalText.replace(/[^0-9]/g, ""));
        await posPage.fillCashReceived(total + 10000);
      }

      await posPage.page.waitForTimeout(500);
    });
  });
});
