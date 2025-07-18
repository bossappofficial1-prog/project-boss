export default defineEventHandler(async (event) => {
  const membershipData = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const membership = {
    id: Math.random().toString(36).substr(2, 9),
    memberCode: 'MEM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    ...membershipData,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return { success: true, data: membership }
})
