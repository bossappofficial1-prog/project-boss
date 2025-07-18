export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const updates = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const product = {
    id,
    ...updates,
    updatedAt: new Date()
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000))

  return { success: true, data: product }
})