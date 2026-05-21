import { request } from "@playwright/test";

const BASE = process.env.API_URL || "http://localhost:5000";

let token = "";

export function setAuthToken(t: string) {
  token = t;
}

async function api(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: any) {
  const ctx = await request.newContext();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await ctx.fetch(`${BASE}${path}`, { method, headers, data });
  return res.json();
}

export async function seedProduct(outletId: string, overrides?: Record<string, any>) {
  return api("POST", "/products", {
    name: "Produk Test E2E",
    type: "GOODS",
    status: "ACTIVE",
    sellingPrice: 25000,
    currentStock: 100,
    ...overrides,
    outletId,
  });
}

export async function seedCategory(outletId: string, name?: string) {
  return api("POST", "/product-categories", {
    name: name || `Kategori Test ${Date.now()}`,
    outletId,
  });
}

export async function cleanupProduct(productId: string) {
  return api("DELETE", `/products/${productId}`);
}

export async function cleanupCategory(categoryId: string) {
  return api("DELETE", `/product-categories/${categoryId}`);
}

export async function getTransactions(outletId: string, page = 1, limit = 10) {
  return api("GET", `/transactions?outletId=${outletId}&page=${page}&limit=${limit}`);
}
