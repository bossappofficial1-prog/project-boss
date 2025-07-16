export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const stats = {
    totalRevenue: 2500000,
    totalOrders: 150,
    totalProducts: 25,
    totalCustomers: 80,
    revenueGrowth: 15.5,
    orderGrowth: 8.2
  }
  
  return stats
})