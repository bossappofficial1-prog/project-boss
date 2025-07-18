export default defineEventHandler(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000))

  return { 
    success: true, 
    data: {
    'umkm' : 239,
    'transactions' : 1234231,
    'memberships' : 123313123,
    }
  }
})