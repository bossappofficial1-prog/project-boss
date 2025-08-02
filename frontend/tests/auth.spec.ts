import { test, expect } from '@playwright/test';

test('should allow a user to log in', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/auth/login');

  // Fill in the email and password
  await page.getByPlaceholder('contoh@email.com').fill('john@coffeeshop.com');
  await page.getByPlaceholder('Masukkan password').fill('password123');

  // Click the login button
  await page.getByRole('button', { name: 'Masuk' }).click();

  // Wait for navigation and assert the new URL
  await page.waitForURL('/umkm/products');
  await expect(page).toHaveURL('/umkm/products');
});