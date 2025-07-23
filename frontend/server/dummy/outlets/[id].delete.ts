export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  return { success: true, message: 'Outlet deleted successfully' }
})