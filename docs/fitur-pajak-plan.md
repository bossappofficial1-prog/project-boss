# Fitur Pajak Per-Produk

## Konsep

- `taxPercentage` (Float?, nullable) di **Product** model
- Admin set per-produk via modal add/edit
- `null` = existing products unaffected
- Tax dihitung otomatis saat order: `taxAmount += item.price × qty × (taxPercentage / 100)`
- `totalAmount = subTotal + taxAmount` — order final amount include tax
- Tax breakdown tampil di receipt, POS, checkout

---

## A. Backend — Prisma & Migration

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `taxPercentage Float?` ke model `Product`. Add `taxAmount Float @default(0)` ke model `Order` |
| | Run `bunx prisma migrate dev --name add-tax-fields` |

---

## B. Backend — Zod Schema

| File | Change |
|------|--------|
| `src/schemas/product.schema.ts` | Add `taxPercentage: z.number().min(0).nullable().optional()` ke `baseProductSchema` |

---

## C. Backend — Repository

| File | Change |
|------|--------|
| `src/repositories/product.repository.ts` | `create()`: add `taxPercentage: data.taxPercentage` ke tiap branch (GOODS/SERVICE/TICKET). `update()`: add `...(data.taxPercentage !== undefined && { taxPercentage: data.taxPercentage })` |

---

## D. Backend — Order Pricing Logic

| File | Change |
|------|--------|
| `src/service/helpers/order-create.helper.ts` | After `subTotal`, iterate `productDetails` → sum `taxAmount` per item. `totalAmount = subTotal + taxAmount`. Pass `taxAmount` ke Order create. Update `OrderCreationResult`. Keep min/max + fee base on `subTotal`. |
| `src/service/order.service.ts` | `getOrderReceiptService()`: include `taxAmount` + breakdown row |
| `src/controller/order.controller.ts` | Include `taxAmount` in order response if missing |

---

## E. Dashboard — Types & API

| File | Change |
|------|--------|
| `hooks/useProductsData.ts` | Add `taxPercentage?: number \| null` ke `ProductItem` |
| `hooks/useProducts.ts` | Add `taxPercentage?: number \| null` ke `Product` |
| `lib/apis/product.ts` | Add `taxPercentage` ke param type `create()` dan `update()` |

---

## F. Dashboard — Product Form Modal

| File | Change |
|------|--------|
| `components/modals/AddProductServiceModal.tsx` | `baseSchema`: add `taxPercentage: z.coerce.number().min(0).nullable().optional()`. Field config: label "Pajak (%)", type "percentage", colSpan 3, condition semua type. Default: `null`. Payload: include. |

---

## G. Dashboard — Product List Table

| File | Change |
|------|--------|
| `components/owner/products/ProductsContent.tsx` | Add column "Pajak" — show `taxPercentage` + "%" or "—" if null |

---

## H. Dashboard — POS Product Display

| File | Change |
|------|--------|
| `components/cashier/pos-v2/ProductCatalog.tsx` | Show badge `+PPN {taxPercentage}%` if tax set |
| POS cart/summary | Add tax breakdown line before total |

---

## I. Frontend Customer — Types

| File | Change |
|------|--------|
| `src/types/product.ts` | Add `taxPercentage?: number \| null` ke `Product` interface |

---

## J. Frontend Customer — Checkout & Cart

| File | Change |
|------|--------|
| `src/types/checkout.ts` | Add `tax?: number` ke `CheckoutData` |
| `src/services/checkout.ts` | `prepareCheckoutData()`: calculate tax per item, include in response |
| `src/components/checkout/CheckoutPage.tsx` | Add tax breakdown row, include in `dynamicGrandTotal` |
| `src/components/payment/PaymentPage.tsx` | Add tax row in PaymentOrderSummary |
| `src/components/payment/PaymentDetailClient.tsx` | Add tax row |
| `src/hooks/useCart.ts` | Store `taxPercentage` in CartItem |
| `src/components/cart/CartDrawer.tsx` | Show tax if applicable |

---

## K. Frontend Customer — Product Card

| File | Change |
|------|--------|
| `src/components/outlet/ProductCard.tsx` | Show badge `+PPN {taxPercentage}%` if tax set |

---

---

## Status: ✅ COMPLETED

All items marked `✅` are implemented and deployed.

| Priority | Item | Status |
|----------|------|--------|
| 1 | Prisma schema + migration | ✅ |
| 2 | Backend schema + repository | ✅ |
| 3 | Order pricing logic (order-create.helper.ts) | ✅ |
| 4 | Order service + receipt | ✅ |
| 5 | Dashboard product form modal | ✅ |
| 6 | Dashboard product list table | ✅ |
| 7 | Dashboard POS catalog + cart summary | ✅ |
| 8 | Frontend customer types | ✅ |
| 9 | Frontend checkout + payment | ✅ |
| 10 | Frontend product card | ✅ |
| — | Dashboard POS CartPanel tax row | ✅ |
| — | Frontend CartDrawer tax display | ✅ |
| — | PaymentDetailClient tax row | ✅ |
| — | Payment detail API taxAmount field | ✅ |

---

## Non-Breaking Guarantee

- `taxPercentage` nullable → existing products = `null` = no tax
- `taxAmount` default `0` → existing orders unaffected
- All changes additive, no column renames/deletions
- Order creation only adds tax when product has `taxPercentage` set
