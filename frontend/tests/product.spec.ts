import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth/login');
    await page.getByPlaceholder('contoh@email.com').fill('test@example.com');
    await page.getByPlaceholder('Masukkan password').fill('password');
    await page.getByRole('button', { name: 'Masuk' }).click();
    console.log(await page.content()); // Log page content for debugging
    await page.waitForURL('/umkm/products');
  });

  test('should allow a user to create a new product', async ({ page }) => {
    // Navigate to the create product page
    await page.goto('/umkm/products/create');

    // Fill out the form
    const productName = `Kopi Enak ${Date.now()}`;
    await page.getByPlaceholder('Masukkan nama produk').fill(productName);
    await page.getByPlaceholder('Deskripsi produk...').fill('Kopi paling enak sedunia.');
    await page.locator('input[v-model.number="form.costPrice"]').fill('10000');
    await page.locator('input[v-model.number="form.price"]').fill('15000');
    
    // Select product type 'Barang'
    // This part might need adjustment depending on how the BaseSelect component is implemented
    await page.locator('div:has(> label:has-text("Tipe Produk")) + div').click();
    await page.getByText('Barang').click();

    await page.locator('input[v-model.number="form.quantity"]').fill('100');
    await page.getByPlaceholder('Contoh: pcs, kg, liter').fill('pcs');

    // Submit the form
    await page.getByRole('button', { name: 'Tambah Produk' }).click();

    // Assert that the user is redirected to the product list
    await page.waitForURL('/umkm/products');
    await expect(page).toHaveURL('/umkm/products');

    // Assert that the new product is visible in the list
    await expect(page.getByText(productName)).toBeVisible();
  });
});