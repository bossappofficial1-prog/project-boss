/**
 * Migration utility for clearing old product data from LocalStorage
 * Run this on app initialization to prevent compatibility issues
 */

const SCHEMA_VERSION_KEY = "product-schema-version";
const CURRENT_VERSION = "2.0";

export function clearOldProductCache() {
  if (typeof window === "undefined") return; // Skip on server-side

  try {
    const version = localStorage.getItem(SCHEMA_VERSION_KEY);

    if (version !== CURRENT_VERSION) {
      // Clear old product data
      localStorage.removeItem("cart");
      localStorage.removeItem("saved-products");
      localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_VERSION);

      console.log("✅ Old product cache cleared due to schema update to v2.0");
    }
  } catch (error) {
    console.error("Failed to clear old product cache:", error);
  }
}
