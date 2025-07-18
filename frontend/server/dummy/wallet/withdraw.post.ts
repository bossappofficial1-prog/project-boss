export default defineEventHandler(async (event) => {
  const { amount, notes } = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const withdrawal = {
    id: Math.random().toString(36).substr(2, 9),
    amount,
    applicationFee: amount * 0.025,
    bankTransferFee: 6500,
    status: 'PENDING',
    notes,
    walletId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return { success: true, data: withdrawal }
})