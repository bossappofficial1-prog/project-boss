export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const products = [
    {
      id: '1',
      name: 'Nasi Goreng',
      description: 'Nasi goreng spesial dengan telur',
      costPrice: 8000,
      price: 15000,
      type: 'GOODS',
      quantity: 50,
      unit: 'porsi',
      status: 'ACTIVE',
      transactionFeeBearer: 'CUSTOMER',
      serviceDurationMinutes: null,
      outletId: query.outletId || '1',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Potong Rambut',
      description: 'Layanan potong rambut premium',
      costPrice: 5000,
      price: 25000,
      type: 'SERVICE',
      quantity: null,
      unit: null,
      status: 'ACTIVE',
      transactionFeeBearer: 'OWNER',
      serviceDurationMinutes: 30,
      outletId: query.outletId || '1',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  return products
})