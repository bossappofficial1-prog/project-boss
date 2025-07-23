export default defineEventHandler(async (event) => {
  const { email, name, password, phone } = await readBody(event)
  
  if (!email || !name || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Required fields missing' })
  }
  
  const user = {
    id: '2',
    email,
    name,
    avatar: null,
    password: 'hashed_password',
    role: 'OWNER',
    isVerified: false,
    phone,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  return {
    success: true,
    data: { user },
    message: 'Registration successful'
  }
})