export default defineEventHandler(async (event) => {
  const orderData = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const order = {
    id: Math.random().toString(36).substr(2, 9),
    totalAmount: orderData.items.reduce((sum: number, item: any) => sum + (item.quantity * 15000), 0),
    bookingDate: orderData.bookingDate,
    customerType: orderData.customerType,
    paymentStatus: 'PENDING',
    queueStatus: 'CREATED',
    midtransTransactionToken: 'dummy-token-123',
    midtransRedirectUrl: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/dummy',
    midtransTransactionDetails: { orderId: 'dummy-order-123' },
    customerId: orderData.customerType === 'REGISTERED' ? '1' : null,
    guestCustomerId: orderData.customerType === 'GUEST' ? Math.random().toString(36).substr(2, 9) : null,
    outletId: orderData.outletId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return { success: true, data: order }
})
