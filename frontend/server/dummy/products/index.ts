import type { Product } from '~/types'
import { ProductType, ServiceStatus, FeeBearer } from '~/types'
import { v4 as uuidv4 } from 'uuid'

export const dummyProducts: Product[] = [
  {
    id: uuidv4(),
    name: 'Kopi Susu',
    description: 'Kopi susu kekinian dengan gula aren',
    costPrice: 10000,
    price: 18000,
    type: ProductType.GOODS,
    quantity: 100,
    unit: 'cup',
    status: ServiceStatus.ACTIVE,
    transactionFeeBearer: FeeBearer.CUSTOMER,
    serviceDurationMinutes: 0,
    outletId: 'dummy-outlet-id-1', // Placeholder
    image: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=Kopi+Susu',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Potong Rambut Pria',
    description: 'Layanan potong rambut untuk pria dewasa',
    costPrice: 15000,
    price: 30000,
    type: ProductType.SERVICE,
    quantity: 0,
    unit: '',
    status: ServiceStatus.ACTIVE,
    transactionFeeBearer: FeeBearer.OWNER,
    serviceDurationMinutes: 30,
    outletId: 'dummy-outlet-id-1', // Placeholder
    image: 'https://via.placeholder.com/150/33FF57/FFFFFF?text=Potong+Rambut',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const addDummyProduct = (product: Product) => {
  dummyProducts.push(product)
}

export const updateDummyProduct = (updatedProduct: Product) => {
  const index = dummyProducts.findIndex(p => p.id === updatedProduct.id)
  if (index !== -1) {
    dummyProducts[index] = updatedProduct
  }
}

export const deleteDummyProduct = (id: string) => {
  const index = dummyProducts.findIndex(p => p.id === id)
  if (index !== -1) {
    dummyProducts.splice(index, 1)
  }
}