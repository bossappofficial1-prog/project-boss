import { test, expect } from '@playwright/test';

test.describe('Outlet Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth/login');
    await page.getByPlaceholder('contoh@email.com').fill('john@coffeeshop.com');
    await page.getByPlaceholder('Masukkan password').fill('password123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/umkm/products');
  });

  test('should allow a user to create a new outlet', async ({ page }) => {
    // Navigate to the create outlet page
    await page.goto('/umkm/outlets/create');

    // Fill out the form
    const outletName = `Toko Cabang ${Date.now()}`;
    await page.getByPlaceholder('Masukkan nama outlet Anda').fill(outletName);
    await page.getByPlaceholder('Alamat lengkap outlet Anda').fill('Jl. Jendral Sudirman No. 123');
    await page.getByPlaceholder('Nomor telepon outlet').fill('081234567890');

    // Submit the form
    await page.getByRole('button', { name: 'Tambah Outlet' }).click();

    // Assert that the user is redirected to the UMKM dashboard
    await page.waitForURL('/umkm');
    await expect(page).toHaveURL('/umkm');

    // Assert that the new outlet is visible on the dashboard
    await expect(page.getByText(outletName)).toBeVisible();
    });
});