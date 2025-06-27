import { PrismaClient } from '@prisma/client';
import { hashing } from '../../src/utils/bcrypt';
import { db } from '../../src/configs/database';

async function main() {
    // Create Owner
    const owner = await db.user.create({
        data: {
            email: 'toko2@example.com',
            name: 'Owner BOSS',
            password: await hashing("Password!23") as string,
            role: 'OWNER',
            isVerified: true
        }
    });

    // Create Customer
    await db.user.create({
        data: {
            email: 'pelanggan@example.com',
            name: 'Customer BOSS',
            password: await hashing("Password!23") as string,
            role: 'CUSTOMER',
            isVerified: true
        }
    });

    // Create Business
    const business = await db.business.create({
        data: {
            name: 'Toko Kopi Abah',
            description: 'Jual kopi dan alat seduh',
            ownerId: owner.id,
            bankName: 'Bank Syariah',
            bankAccount: '1234567890',
            accountHolder: 'Owner BOSS',
            wallet: {
                create: {
                    balance: 1000000
                }
            }
        }
    });

    // Create Outlet
    const outlet = await db.outlet.create({
        data: {
            name: 'Outlet Pusat',
            address: 'Jl. Raya No.1',
            phone: '08123456789',
            businessId: business.id
        }
    });

    // Create Products (GOODS + SERVICE)
    const kopi = await db.product.create({
        data: {
            name: 'Kopi Arabica 250gr',
            description: 'Biji kopi arabica pilihan',
            price: 75000,
            type: 'GOODS',
            businessId: business.id,
            unit: "pcs",
            quantity: 200
        }
    });

    const servis = await db.product.create({
        data: {
            name: 'Servis Laptop',
            description: 'Paket servis ringan',
            price: 150000,
            type: 'SERVICE',
            businessId: business.id,
            costPrice: 12000,
        }
    });

    console.log('🌱 Seeding sukses!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
