// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    success: true,
    token: 'dummy-jwt-token-123'
  }
})
