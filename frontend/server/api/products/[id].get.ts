import { defineEventHandler } from 'h3'
import { dummyProducts } from '~/server/dummy/products'

export default defineEventHandler(async (event) => {
  const productId = event.context.params?.id as string

  const product = dummyProducts.find(p => p.id === productId)

  if (!product) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Produk tidak ditemukan',
      errors: []
    }
  }

  return {
    success: true,
    data: {
      product
    }
  }
})
