import { defineEventHandler, readBody } from 'h3'
import { v4 as uuidv4 } from 'uuid'
import { ProductType, ServiceStatus, FeeBearer, type ProductForm, type Product } from '~/types'
import { addDummyProduct } from '~/server/dummy/products'

export default defineEventHandler(async (event) => {
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

  // Simulate product creation
  const newProduct: Product = {
    id: uuidv4(),
    name: body.name,
    description: body.description || undefined,
    costPrice: body.costPrice,
    price: body.price,
    type: body.type,
    quantity: body.quantity || undefined,
    unit: body.unit || undefined,
    status: body.status,
    transactionFeeBearer: body.transactionFeeBearer || undefined,
    serviceDurationMinutes: body.serviceDurationMinutes || undefined,
    outletId: 'dummy-outlet-id-1', // Placeholder, assuming a default outlet for now
    image: body.image || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  addDummyProduct(newProduct)

  return {
    success: true,
    message: 'Produk berhasil dibuat',
    data: {
      product: newProduct
    }
  }
})