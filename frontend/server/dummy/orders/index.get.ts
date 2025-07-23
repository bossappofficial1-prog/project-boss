export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const orders = [
    {
      id: '1',
      totalAmount: 30000,
      bookingDate: new Date(),
      customerType: 'REGISTERED',
      paymentStatus: 'CAPTURE',
      queueStatus: 'COMPLETED',
      midtransTransactionToken: null,
      midtransRedirectUrl: null,
      midtransTransactionDetails: null,
      customerId: '1',
      guestCustomerId: null,
      outletId: query.outletId || '1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  return orders
})