export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const slots = [
    {
      id: '1',
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      status: 'AVAILABLE',
      productId: query.productId || '2',
      orderId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  return slots
})