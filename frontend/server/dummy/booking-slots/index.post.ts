export default defineEventHandler(async (event) => {
  const slotData = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const slot = {
    id: Math.random().toString(36).substr(2, 9),
    ...slotData,
    status: 'AVAILABLE',
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return { success: true, data: slot }
})
