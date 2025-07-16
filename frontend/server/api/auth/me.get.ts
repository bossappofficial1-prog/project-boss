export default defineEventHandler(async (event) => {
    // Ambil token dari header Authorization
    const authHeader = event.req.headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const token = authHeader.replace('Bearer ', '')

    // Dummy verifikasi token
    if (token !== 'dummy-jwt-token-123') {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    // Dummy user & business data
    const user = {
        id: '1',
        email: 'john.doe@email.com',
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

    return {
        user,
        business
    }
})