import { defineEventHandler, readBody } from 'h3'
import { ProductType, ServiceStatus, FeeBearer, type ProductForm, type Product } from '~/types'
import { dummyProducts, updateDummyProduct } from '~/server/dummy/products'

export default defineEventHandler(async (event) => {
  const productId = event.context.params?.id as string
  const body = await readBody<ProductForm>(event)

  // Simulate API validation
  if (!body.name) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Nama produk harus diisi',
      errors: ['name: Nama produk harus diisi']
    }
  }
  if (body.costPrice < 0) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Harga modal tidak boleh negatif',
      errors: ['costPrice: Harga modal tidak boleh negatif']
    }
  }
  if (body.price < 0) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Harga jual tidak boleh negatif',
      errors: ['price: Harga jual tidak boleh negatif']
    }
  }
  if (body.type === ProductType.GOODS && (body.quantity === undefined || body.quantity < 0)) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Jumlah barang tidak boleh negatif',
      errors: ['quantity: Jumlah barang tidak boleh negatif']
    }
  }
  if (body.type === ProductType.SERVICE && (body.serviceDurationMinutes === undefined || body.serviceDurationMinutes < 0)) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Durasi layanan tidak boleh negatif',
      errors: ['serviceDurationMinutes: Durasi layanan tidak boleh negatif']
    }
  }

  // Find the product to update
  const existingProduct = dummyProducts.find(p => p.id === productId)
  if (!existingProduct) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Produk tidak ditemukan',
      errors: []
    }
  }

  // Simulate product update
  const updated: Product = {
    ...existingProduct,
    name: body.name,
    description: body.description || existingProduct.description || undefined,
    costPrice: body.costPrice,
    price: body.price,
    type: body.type,
    quantity: body.quantity || existingProduct.quantity || undefined,
    unit: body.unit || existingProduct.unit || undefined,
    status: body.status,
    transactionFeeBearer: body.transactionFeeBearer || existingProduct.transactionFeeBearer || undefined,
    serviceDurationMinutes: body.serviceDurationMinutes || existingProduct.serviceDurationMinutes || undefined,
    image: body.image || existingProduct.image || undefined,
    updatedAt: new Date(),
  }

  updateDummyProduct(updated)

  return {
    success: true,
    message: 'Produk berhasil diperbarui',
    data: {
      product: updated
    }
  }
})