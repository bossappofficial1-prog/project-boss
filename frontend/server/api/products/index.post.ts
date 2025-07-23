export default defineEventHandler(async (event) => {
  const productData = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const product = {
    id: Math.random().toString(36).substr(2, 9),
    ...productData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000))

  return { success: true, data: product }
})