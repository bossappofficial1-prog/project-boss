import { db } from "../../src/configs/database";
import { hashing } from "../../src/utils/bcrypt";

// Data dummy untuk seeding
const userData = [
    {
        id: 'user-customer-1',
        email: 'customer1@example.com',
        name: 'Ahmad Rizki',
        password: 'password123',
        role: 'CUSTOMER',
        isVerified: true,
    },
    {
        id: 'user-customer-2',
        email: 'customer2@example.com',
        name: 'Siti Aminah',
        password: 'password123',
        role: 'CUSTOMER',
        isVerified: true,
    },
    {
        id: 'user-owner-1',
        email: 'owner1@example.com',
        name: 'Budi Santoso',
        password: 'password123',
        role: 'OWNER',
        isVerified: true,
    },
    {
        id: 'user-owner-2',
        email: 'owner2@example.com',
        name: 'Dewi Lestari',
        password: 'password123',
        role: 'OWNER',
        isVerified: true,
    },
];

const businessData = [
    {
        id: 'business-1',
        name: 'Warung Makan Bu Budi',
        description: 'Warung makan tradisional dengan cita rasa autentik',
        bankName: 'BCA',
        bankAccount: '1234567890',
        accountHolder: 'Budi Santoso',
        ownerId: 'user-owner-1',
        defaultTransactionFeeBearer: 'OWNER',
    },
    {
        id: 'business-2',
        name: 'Salon Kecantikan Dewi',
        description: 'Salon lengkap untuk perawatan kecantikan wanita',
        bankName: 'Mandiri',
        bankAccount: '0987654321',
        accountHolder: 'Dewi Lestari',
        ownerId: 'user-owner-2',
        defaultTransactionFeeBearer: 'CUSTOMER',
    },
];

const outletNames = [
    'Cabang Pusat', 'Cabang Timur', 'Cabang Barat', 'Cabang Utara', 'Cabang Selatan'
];

const foodProducts = [
    { name: 'Nasi Gudeg', description: 'Nasi gudeg khas Yogyakarta', price: 15000, costPrice: 8000 },
    { name: 'Ayam Bakar', description: 'Ayam bakar bumbu kecap', price: 20000, costPrice: 12000 },
    { name: 'Gado-gado', description: 'Gado-gado dengan bumbu kacang', price: 12000, costPrice: 6000 },
    { name: 'Soto Ayam', description: 'Soto ayam kuah bening', price: 13000, costPrice: 7000 },
    { name: 'Rendang Daging', description: 'Rendang daging sapi pedas', price: 25000, costPrice: 15000 },
    { name: 'Es Teh Manis', description: 'Es teh manis segar', price: 3000, costPrice: 1000 },
    { name: 'Jus Jeruk', description: 'Jus jeruk segar tanpa gula', price: 8000, costPrice: 4000 },
    { name: 'Kerupuk Udang', description: 'Kerupuk udang renyah', price: 5000, costPrice: 2000 },
    { name: 'Sambal Terasi', description: 'Sambal terasi pedas', price: 2000, costPrice: 500 },
    { name: 'Nasi Putih', description: 'Nasi putih hangat', price: 4000, costPrice: 1500 },
];

const beautyServices = [
    { name: 'Potong Rambut Wanita', description: 'Potong rambut sesuai model terkini', price: 50000, costPrice: 15000 },
    { name: 'Creambath', description: 'Perawatan rambut dengan cream khusus', price: 75000, costPrice: 25000 },
    { name: 'Facial Acne', description: 'Perawatan wajah untuk kulit berjerawat', price: 100000, costPrice: 40000 },
    { name: 'Manicure Pedicure', description: 'Perawatan kuku tangan dan kaki', price: 60000, costPrice: 20000 },
    { name: 'Hair Styling', description: 'Styling rambut untuk acara khusus', price: 80000, costPrice: 25000 },
    { name: 'Waxing Kaki', description: 'Waxing untuk kaki halus', price: 90000, costPrice: 30000 },
    { name: 'Eyebrow Shaping', description: 'Rapikan bentuk alis', price: 35000, costPrice: 10000 },
    { name: 'Hair Coloring', description: 'Pewarnaan rambut profesional', price: 150000, costPrice: 60000 },
    { name: 'Deep Cleansing', description: 'Pembersihan wajah mendalam', price: 85000, costPrice: 35000 },
    { name: 'Hair Rebonding', description: 'Pelurusan rambut permanen', price: 200000, costPrice: 80000 },
];

async function main() {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. Seed Users
        console.log('👤 Seeding users...');
        for (const user of userData) {
            const hashedPassword = await hashing(user.password);

            await db.user.upsert({
                where: { email: user.email },
                update: {
                    name: user.name,
                    role: user.role as any,
                    isVerified: user.isVerified,
                },
                create: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    password: hashedPassword!,
                    role: user.role as any,
                    isVerified: user.isVerified,
                },
            });
        }

        // 2. Seed Businesses with Wallets
        console.log('🏢 Seeding businesses and wallets...');
        for (const business of businessData) {
            await db.business.upsert({
                where: { ownerId: business.ownerId },
                update: {
                    name: business.name,
                    description: business.description,
                    bankName: business.bankName,
                    bankAccount: business.bankAccount,
                    accountHolder: business.accountHolder,
                    defaultTransactionFeeBearer: business.defaultTransactionFeeBearer as any,
                },
                create: {
                    id: business.id,
                    name: business.name,
                    description: business.description,
                    bankName: business.bankName,
                    bankAccount: business.bankAccount,
                    accountHolder: business.accountHolder,
                    ownerId: business.ownerId,
                    defaultTransactionFeeBearer: business.defaultTransactionFeeBearer as any,
                    wallet: {
                        create: {
                            balance: Math.floor(Math.random() * 1000000) + 100000, // Random balance 100k - 1.1M
                        },
                    },
                },
            });
        }

        // 3. Seed Outlets
        console.log('🏪 Seeding outlets...');
        for (const business of businessData) {
            for (let i = 0; i < outletNames.length; i++) {
                const outletId = `${business.id}-outlet-${i + 1}`;

                await db.outlet.upsert({
                    where: { id: outletId },
                    update: {
                        name: outletNames[i],
                        address: `Jl. ${outletNames[i]} No. ${Math.floor(Math.random() * 100) + 1}`,
                        phone: `08${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
                    },
                    create: {
                        id: outletId,
                        name: outletNames[i],
                        address: `Jl. ${outletNames[i]} No. ${Math.floor(Math.random() * 100) + 1}`,
                        phone: `08${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
                        businessId: business.id,
                    },
                });
            }
        }

        // 4. Seed Products
        console.log('📦 Seeding products...');

        // Products for Warung Makan (GOODS)
        const business1Outlets = await db.outlet.findMany({
            where: { businessId: 'business-1' },
        });

        for (const outlet of business1Outlets) {
            for (let i = 0; i < foodProducts.length; i++) {
                const product = foodProducts[i];
                const productId = `${outlet.id}-product-${i + 1}`;

                await db.product.upsert({
                    where: { id: productId },
                    update: {
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        costPrice: product.costPrice,
                        quantity: Math.floor(Math.random() * 100) + 10, // Random stock 10-109
                        unit: 'Porsi',
                    },
                    create: {
                        id: productId,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        costPrice: product.costPrice,
                        type: 'GOODS',
                        quantity: Math.floor(Math.random() * 100) + 10,
                        unit: 'Porsi',
                        businessId: 'business-1',
                        outletId: outlet.id,
                    },
                });
            }
        }

        // Products for Salon (SERVICES)
        const business2Outlets = await db.outlet.findMany({
            where: { businessId: 'business-2' },
        });

        for (const outlet of business2Outlets) {
            for (let i = 0; i < beautyServices.length; i++) {
                const service = beautyServices[i];
                const productId = `${outlet.id}-service-${i + 1}`;

                await db.product.upsert({
                    where: { id: productId },
                    update: {
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        costPrice: service.costPrice,
                        unit: 'Layanan',
                    },
                    create: {
                        id: productId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        costPrice: service.costPrice,
                        type: 'SERVICE',
                        quantity: null, // Services don't have stock
                        unit: 'Layanan',
                        businessId: 'business-2',
                        outletId: outlet.id,
                    },
                });
            }
        }

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📊 Seeding Summary:');
        console.log(`- Users: ${userData.length} (${userData.filter(u => u.role === 'CUSTOMER').length} customers, ${userData.filter(u => u.role === 'OWNER').length} owners)`);
        console.log(`- Businesses: ${businessData.length} (each with wallet)`);
        console.log(`- Outlets: ${businessData.length * outletNames.length} total`);
        console.log(`- Products: ${business1Outlets.length * foodProducts.length + business2Outlets.length * beautyServices.length} total`);

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    } finally {
        await db.$disconnect();
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled promise rejection:', err);
    process.exit(1);
});

main()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });

// Export untuk testing
module.exports = { main };