import { test, expect } from '@playwright/test';

test.describe('Expense Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth/login');
    await page.getByPlaceholder('contoh@email.com').fill('john@coffeeshop.com');
    await page.getByPlaceholder('Masukkan password').fill('password123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/umkm/products');
  });

  test('should allow a user to create a new expense', async ({ page }) => {
    // Navigate to the create expense page
    await page.goto('/umkm/expense/create');

    // Fill out the form
    const expenseDescription = `Beli Kopi ${Date.now()}`;
    await page.getByPlaceholder('Contoh: Pembelian bahan baku, Gaji karyawan').fill(expenseDescription);
    await page.getByPlaceholder('0').fill('50000');
    await page.locator('input[type="date"]').fill('2025-07-31');

    // Submit the form
    await page.getByRole('button', { name: 'Tambah Pengeluaran' }).click();

    // Assert that the user is redirected to the expense list
    await page.waitForURL('/umkm/expense');
    await expect(page).toHaveURL('/umkm/expense');

    // Assert that the new expense is visible in the list
    await expect(page.getByText(expenseDescription)).toBeVisible();
  });
});