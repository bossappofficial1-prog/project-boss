import { Page, expect } from "@playwright/test";

export async function expectPageTitle(page: Page, title: string) {
  await expect(page.locator("h1, h2").first()).toContainText(title, { timeout: 10000 });
}

export async function waitForTableLoad(page: Page) {
  await page.waitForSelector('[role="region"]', { timeout: 15000 });
  await page.waitForTimeout(500);
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

export async function openSidebarMenu(page: Page, label: string) {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  await sidebar.locator(`text=${label}`).click();
  await page.waitForTimeout(300);
}
