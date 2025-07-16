export default defineEventHandler(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000))

  return { 
    success: true, 
    data: {
    'umkm' : 239,
    'total_transaction' : 1234231,
    'total_membership' : 123313123,
    }
  }
})