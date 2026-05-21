import { Page, request } from "@playwright/test";

const STORAGE_STATE = "playwright/.auth/user.json";

type Role = "OWNER" | "CASHIER";

export async function loginAsOwner(page: Page) {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', process.env.OWNER_EMAIL!);
  await page.fill('input[name="password"]', process.env.OWNER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL("/owner", { timeout: 15000 });
  await page.context().storageState({ path: STORAGE_STATE });
}

export async function loginAsCashier(page: Page) {
  await page.goto("/auth/login/cashier");
  await page.fill('input[name="username"]', process.env.CASHIER_USERNAME!);
  await page.fill('input[name="password"]', process.env.CASHIER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL("/cashier/**", { timeout: 15000 });
  await page.context().storageState({ path: STORAGE_STATE });
}

export async function loginViaApi(role: Role) {
  const ctx = await request.newContext();
  const payload =
    role === "OWNER"
      ? { email: process.env.OWNER_EMAIL!, password: process.env.OWNER_PASSWORD! }
      : { username: process.env.CASHIER_USERNAME!, password: process.env.CASHIER_PASSWORD! };

  const endpoint = role === "OWNER" ? "/auth/login" : "/auth/login/cashier";
  const res = await ctx.post(`${process.env.API_URL}${endpoint}`, { data: payload });
  return res.json() as Promise<{ data: { token: string } }>;
}

export async function saveAuthState(page: Page) {
  await page.context().storageState({ path: STORAGE_STATE });
}

export async function restoreAuthState(page: Page) {
  await page.context().addCookies([]);
  await page.context().storageState({ path: STORAGE_STATE });
}
