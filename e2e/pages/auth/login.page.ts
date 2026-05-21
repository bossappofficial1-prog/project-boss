import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get emailInput(): Locator {
    return this.page.locator('input[name="email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[name="password"]');
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  get errorMessage(): Locator {
    return this.page.locator("[role='alert'], .text-red-500, .text-destructive").first();
  }

  async goto() {
    await this.page.goto("/auth/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL("/owner", { timeout: 15000 });
  }

  async expectError() {
    await this.errorMessage.waitFor({ state: "visible", timeout: 10000 });
  }
}

export class CashierLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get usernameInput(): Locator {
    return this.page.locator('input[name="username"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[name="password"]');
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/auth/login/cashier");
    await this.page.waitForLoadState("networkidle");
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectToPOS() {
    await this.page.waitForURL("/cashier/**", { timeout: 15000 });
  }
}
