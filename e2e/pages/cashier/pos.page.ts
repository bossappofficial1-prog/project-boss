import { Page, expect } from "@playwright/test";

export class PosPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/cashier/pos");
    await this.page.waitForLoadState("networkidle");
  }

  get catalogPanel() {
    return this.page.locator("[data-guide='product-catalog']");
  }

  get cartPanel() {
    return this.page.locator("[data-guide='pos-cart']");
  }

  get customerSection() {
    return this.page.locator("[data-guide='pos-customer']");
  }

  get paymentSection() {
    return this.page.locator("[data-guide='pos-payment']");
  }

  get submitSection() {
    return this.page.locator("[data-guide='pos-submit']");
  }

  get productSearchInput() {
    return this.catalogPanel.locator("input[placeholder]").first();
  }

  get bayarButton() {
    return this.submitSection.locator("button:has-text('Bayar')");
  }

  get simpanButton() {
    return this.submitSection.locator("button:has-text('Simpan')");
  }

  async expectCatalogVisible() {
    await expect(this.catalogPanel).toBeVisible({ timeout: 10000 });
  }

  async expectCartVisible() {
    await expect(this.cartPanel).toBeVisible({ timeout: 5000 });
  }

  async searchProduct(query: string) {
    await this.productSearchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async addProductToCart(productName: string) {
    const product = this.catalogPanel.locator(`text=${productName}`).first();
    await product.click();
    await this.page.waitForTimeout(300);
  }

  async expectProductInCart(productName: string) {
    await expect(this.cartPanel.locator(`text=${productName}`).first()).toBeVisible({
      timeout: 5000,
    });
  }

  async increaseQuantity(productName: string) {
    const item = this.cartPanel.locator(`text=${productName}`).first().locator("..").locator("..");
    await item.locator("button:has([class*='lucide-plus'])").click();
  }

  async decreaseQuantity(productName: string) {
    const item = this.cartPanel.locator(`text=${productName}`).first().locator("..").locator("..");
    await item.locator("button:has([class*='lucide-minus'])").click();
  }

  async removeProduct(productName: string) {
    const item = this.cartPanel.locator(`text=${productName}`).first().locator("..").locator("..");
    await item.locator("button:has([class*='lucide-trash'])").click();
  }

  async fillCustomerName(name: string) {
    const input = this.customerSection.locator("input").first();
    await input.fill(name);
  }

  async fillCustomerPhone(phone: string) {
    const inputs = this.customerSection.locator("input");
    const count = await inputs.count();
    if (count > 1) await inputs.nth(1).fill(phone);
  }

  async toggleWalkIn() {
    const toggle = this.customerSection.locator('[role="switch"], button:has-text("Walk-in")');
    await toggle.click();
  }

  async selectPaymentCash() {
    await this.paymentSection.locator("text=Tunai").click();
  }

  async selectPaymentQris() {
    await this.paymentSection.locator("text=QRIS").click();
  }

  async fillCashReceived(amount: number) {
    const input = this.paymentSection.locator("input").first();
    await input.fill(amount.toString());
  }

  async clickBayar() {
    await this.bayarButton.click();
  }

  async confirmPayment() {
    const confirmDialog = this.page.locator('[role="alertdialog"]');
    await confirmDialog.locator("button:has-text('Bayar')").click();
  }

  async expectOrderSuccess() {
    await expect(this.page.locator("text=Pesanan berhasil")).toBeVisible({
      timeout: 15000,
    });
  }
}
