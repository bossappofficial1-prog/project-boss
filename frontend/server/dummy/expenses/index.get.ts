export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const expenses = [
    {
      id: '1',
      description: 'Pembelian bahan baku',
      amount: 100000,
      date: new Date(),
      outletId: query.outletId || '1',
      createdAt: new Date()
    }
  ]
  
  return expenses
})