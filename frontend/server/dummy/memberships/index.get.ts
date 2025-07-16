export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const memberships = [
    {
      id: '1',
      memberCode: 'MEM001',
      memberType: 'VIP',
      discountPercentage: 10,
      isActive: true,
      notes: 'Member VIP dengan diskon 10%',
      customerId: '1',
      businessId: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  return memberships
})
