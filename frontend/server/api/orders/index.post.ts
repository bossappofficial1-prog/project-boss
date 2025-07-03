export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const dummyOrderId = 'order-' + Math.floor(Math.random() * 10000)
  const dummyTransactionId = 'txn-' + Math.floor(Math.random() * 10000)

  const order = {
    id: dummyOrderId,
    totalAmount: body.totalAmount,
    bookingDate: body.bookingDate || null,
    paymentStatus: 'PENDING',
    queueStatus: 'AWAITING_PAYMENT',
    midtransTransactionToken: 'dummy-token-' + dummyOrderId,
    midtransRedirectUrl: 'https://payment.example.com/redirect/' + dummyOrderId,
    customerId: body.customerId,
    outletId: body.outletId,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: body.items.map((item: any) => ({
      id: 'item-' + Math.floor(Math.random() * 10000),
      productId: item.productId,
      quantity: item.quantity,
      priceAtTimeOfOrder: item.price
    })),
    transaction: {
      id: dummyTransactionId,
      amount: body.totalAmount,
      paymentMethod: null,
      status: 'PENDING',
      fee: 0,
      adminFee: 0,
      feePaidBy: null,
      paidAt: null
    }
  }

  return {
    success: true,
    message: 'Order berhasil dibuat',
    data: order
  }
})
