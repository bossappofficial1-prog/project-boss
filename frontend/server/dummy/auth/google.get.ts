export default defineEventHandler(async (event) => {
  const dummyToken = 'dummy-jwt-token-123'

  await new Promise((resolve) => setTimeout(resolve, 1000))
  
  const redirectUrl = `/auth?token=${dummyToken}`

  return sendRedirect(event, redirectUrl)
})