export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const updates = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const order = {
    id,
    ...updates,
    updatedAt: new Date()
  }
  
  return { success: true, data: order }
})