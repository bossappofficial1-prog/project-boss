export default defineEventHandler(async (event) => {
  const updates = await readBody(event)
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const user = {
    id: '1',
    email: 'john@example.com',
    name: updates.name || 'John Doe',
    avatar: updates.avatar || null,
    password: 'hashed_password',
    role: 'OWNER',
    isVerified: true,
    phone: updates.phone || '+6281234567890',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return { user }
})