export default defineEventHandler(async (event) => {
  const expenseData = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const expense = {
    id: Math.random().toString(36).substr(2, 9),
    ...expenseData,
    createdAt: new Date()
  }
  
  return { success: true, data: expense }
})