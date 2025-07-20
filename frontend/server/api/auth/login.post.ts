// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  // Dummy validation
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  // Simulate wrong credentials
  if (email !== 'john.doe@email.com' || password !== 'password') {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  // Simulate authentication delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    success: true,
    token: 'dummy-jwt-token-123'
  }
})
