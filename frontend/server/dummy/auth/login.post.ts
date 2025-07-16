export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  // Dummy validation
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }
  
  // Dummy user data
  const user = {
    id: '1',
    email,
    name: 'John Doe',
    avatar: null,
    password: 'hashed_password',
    role: 'OWNER',
    isVerified: true,
    phone: '+6281234567890',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const outlets = [
    {
      id: '1',
      name: 'Main Store',
      address: 'Jl. Sudirman No. 123',
      phone: '+6281234567890',
      businessId: '1',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  return {
    token: 'dummy-jwt-token-123',
    user,
    outlets
  }
})