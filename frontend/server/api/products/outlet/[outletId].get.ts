import { defineEventHandler } from 'h3'
import { dummyProducts } from '~/server/dummy/products'

export default defineEventHandler(async (event) => {
  const outletId = event.context.params?.outletId as string

  // Filter products by outletId. For dummy, we'll use a placeholder outletId.
  const filteredProducts = dummyProducts.filter(p => p.outletId === outletId || outletId === 'dummy-outlet-id-1')

  return {
    success: true,
    data: {
      products: filteredProducts
    }
  }
})