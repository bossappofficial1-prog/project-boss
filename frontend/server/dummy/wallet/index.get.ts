export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const wallet = {
    id: '1',
    balance: 500000,
    businessId: '1',
    updatedAt: new Date()
  }
  
  return wallet
})