import { Product, Goods, Service } from "@/types/product";

/**
 * Get selling price dari product (GOODS atau SERVICE)
 */
export function getProductPrice(product: Product): number {
  if (product.type === "GOODS" && product.goods) {
    return product.goods.sellingPrice;
  }
  if (product.type === "SERVICE" && product.service) {
    return product.service.sellingPrice;
  }
  return 0;
}

/**
 * Get unit dari GOODS product
 */
export function getProductUnit(product: Product): string | null {
  if (product.type === "GOODS" && product.goods) {
    return product.goods.unit;
  }
  return null;
}

/**
 * Get current stock untuk GOODS product
 */
export function getProductStock(product: Product): number | null {
  if (product.type === "GOODS" && product.goods) {
    return product.goods.currentStock;
  }
  return null;
}

/**
 * Get duration untuk SERVICE product (dalam menit)
 */
export function getServiceDuration(product: Product): number | null {
  if (product.type === "SERVICE" && product.service) {
    return product.service.durationMinutes;
  }
  return null;
}

/**
 * Check apakah produk out of stock
 */
export function isProductOutOfStock(product: Product): boolean {
  if (product.type === "GOODS" && product.goods) {
    return product.goods.currentStock <= 0;
  }
  return false;
}

/**
 * Check apakah produk low stock
 */
export function isProductLowStock(product: Product, threshold: number = 5): boolean {
  if (product.type === "GOODS" && product.goods) {
    return product.goods.currentStock > 0 && product.goods.currentStock <= threshold;
  }
  return false;
}
