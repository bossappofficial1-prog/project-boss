import { test, expect } from "@playwright/test";
import { LoginPage, CashierLoginPage } from "../../pages/auth/login.page";

test.describe("Owner Login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form", async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should show error on invalid credentials", async () => {
    await loginPage.login("wrong@email.com", "wrongpassword");
    await loginPage.expectError();
  });

  test("should show error on empty fields", async () => {
    await loginPage.submitButton.click();
    await loginPage.expectError();
  });

  test("should login successfully with valid owner credentials", async ({
    page,
  }) => {
    const email = process.env.OWNER_EMAIL;
    const password = process.env.OWNER_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "Missing OWNER_EMAIL or OWNER_PASSWORD in environment variables",
      );
    }

    await loginPage.login(
      process.env.OWNER_EMAIL!,
      process.env.OWNER_PASSWORD!,
    );
    await loginPage.expectRedirectToDashboard();
    await expect(page.locator("text=Manajemen Outlet")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Cashier Login", () => {
  let cashierLoginPage: CashierLoginPage;

  test.beforeEach(async ({ page }) => {
    cashierLoginPage = new CashierLoginPage(page);
    await cashierLoginPage.goto();
  });

  test("should display cashier login form", async () => {
    await expect(cashierLoginPage.usernameInput).toBeVisible();
    await expect(cashierLoginPage.passwordInput).toBeVisible();
    await expect(cashierLoginPage.submitButton).toBeVisible();
  });

  test("should login successfully with valid cashier credentials", async ({
    page,
  }) => {
    await cashierLoginPage.login(
      process.env.CASHIER_USERNAME!,
      process.env.CASHIER_PASSWORD!,
    );
    await cashierLoginPage.expectRedirectToPOS();
    await expect(page.locator("text=Riwayat")).toBeVisible({ timeout: 10000 });
  });
});
