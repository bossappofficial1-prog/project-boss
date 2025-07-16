export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  // Dummy validation
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
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
    },
    {
      id: '2',
      name: 'Second Store',
      address: 'Jl. Sudirman No. 123',
      phone: '+6281234567890',
      businessId: '1',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

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

  const business = {
    id: '1',
    name: 'Acme Corp',
    description: 'Leading retailer in Indonesia',
    createdAt: new Date(),
    updatedAt: new Date(),
    bankName: 'Bank Central Asia',
    bankAccount: '1234567890',
    accountHolder: 'John Doe',
    ownerId: user.id,
    defaultTransactionFeeBearer: 'OWNER',
    owner: user,
    outlets: outlets,
    wallet: undefined,
    memberships: []
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  return {
    token: 'dummy-jwt-token-123',
    user,
    business
  }
})