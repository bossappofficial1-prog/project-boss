export default defineEventHandler(async (event) => {
  const { name, address, phone, image } = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const outlet = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    address,
    phone,
    businessId: '1',
    image,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return { success: true, data: outlet }
})
