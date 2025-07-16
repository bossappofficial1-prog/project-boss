export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const topProducts = [
    {
      id: '1',
      name: 'Nasi Goreng',
      totalSold: 45,
      revenue: 675000
    },
    {
      id: '2',
      name: 'Potong Rambut',
      totalSold: 30,
      revenue: 750000
    },
    {
      id: '3',
      name: 'Ayam Bakar',
      totalSold: 25,
      revenue: 500000
    }
  ]
  
  return topProducts
})