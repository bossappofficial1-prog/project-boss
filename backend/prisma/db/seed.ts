import { PrismaClient, ProductType, UserRole } from '@prisma/client';
import { BcryptUtil } from '../../src/utils';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Hapus data lama (opsional, tapi disarankan untuk konsistensi)
    // Urutan penghapusan penting untuk menghindari error foreign key
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.outlet.deleteMany({});
    await prisma.business.deleteMany({});
    await prisma.guestCustomer.deleteMany({});
    console.log('🗑️ Old data cleaned.');

    // 2. Buat atau dapatkan User (Owner)
    const ownerEmail = 'owner@boss.com';
    let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });

    if (!owner) {
        const hashedPassword = await BcryptUtil.hash('password123');
        owner = await prisma.user.create({
            data: {
                name: 'John Doe (Owner)',
                email: ownerEmail,
                password: hashedPassword,
                role: UserRole.OWNER,
            },
        });
        console.log(`👤 Owner created: ${owner.email}`);
    } else {
        console.log(`👤 Owner already exists: ${owner.email}`);
    }

    // 3. Buat Business
    const business = await prisma.business.create({
        data: {
            name: 'Kopi Kenangan Jiwa',
            description: 'Menjual kopi dan makanan ringan dengan sepenuh jiwa.',
            ownerId: owner.id,
            bankName: 'BCA',
            bankAccount: '1234567890',
            accountHolder: 'John Doe',
        },
    });
    console.log(`🏢 Business created: ${business.name}`);

    // 4. Buat beberapa Outlet
    const outlet1 = await prisma.outlet.create({
        data: {
            name: 'Kopi Kenangan Jiwa - Cabang Sudirman',
            address: 'Jl. Jenderal Sudirman No. 1, Jakarta',
            phone: '081234567890',
            businessId: business.id,
        },
    });

    const outlet2 = await prisma.outlet.create({
        data: {
            name: 'Kopi Kenangan Jiwa - Cabang Thamrin',
            address: 'Jl. M.H. Thamrin No. 2, Jakarta',
            phone: '081234567891',
            businessId: business.id,
        },
    });
    console.log(`🏪 Outlets created: ${outlet1.name}, ${outlet2.name}`);

    // 5. Buat beberapa Product
    // Produk untuk Outlet 1
    await prisma.product.createMany({
        data: [
            { name: 'Kopi Susu Gula Aren', price: 18000, type: ProductType.GOODS, quantity: 100, outletId: outlet1.id },
            { name: 'Croissant Coklat', price: 22000, type: ProductType.GOODS, quantity: 50, outletId: outlet1.id },
            { name: 'Jasa Barista 1 Jam', price: 150000, type: ProductType.SERVICE, quantity: 5, outletId: outlet1.id },
        ],
    });

    // Produk untuk Outlet 2
    await prisma.product.createMany({
        data: [
            { name: 'Americano', price: 15000, type: ProductType.GOODS, quantity: 100, outletId: outlet2.id },
            { name: 'Donat Gula', price: 10000, type: ProductType.GOODS, quantity: 70, outletId: outlet2.id },
            { name: 'Jasa Konsultasi Kopi', price: 250000, type: ProductType.SERVICE, quantity: 3, outletId: outlet2.id },
        ],
    });
    console.log('📦 Products created for both outlets.');

    // 6. Buat beberapa GuestCustomer
    await prisma.guestCustomer.createMany({
        data: [
            { name: 'Alice', email: 'alice@example.com', phone: '085611112222' },
            { name: 'Bob', email: 'bob@example.com', phone: '085733334444' },
        ],
    });
    console.log('🙋 Guest customers created.');

    console.log('✅ Seeding finished successfully!');
}

main()
    .catch((err) => {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
