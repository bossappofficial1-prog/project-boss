export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const updates = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const outlet = {
    id,
    name: updates.name || 'Updated Store',
    address: updates.address,
    phone: updates.phone,
    businessId: '1',
    image: updates.image,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return { success: true, data: outlet }
})