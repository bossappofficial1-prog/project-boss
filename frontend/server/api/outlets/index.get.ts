export default defineEventHandler(async (event) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return {
    "success": true,
    "data":[

      {
        id: '1',
        name: 'Main Store',
        address: 'Jl. Sudirman No. 123',
        phone: '+6281234567890',
        businessId: '1',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Branch Store',
        address: 'Jl. Thamrin No. 456',
        phone: '+6281234567891',
        businessId: '1',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
})