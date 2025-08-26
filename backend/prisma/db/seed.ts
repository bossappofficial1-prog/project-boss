import { PrismaClient, ProductType, UserRole, ServiceStatus, FeeBearer } from '@prisma/client';
import { BcryptUtil } from '../../src/utils';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting simplified database seeding...');

    // 1. Clean existing data
    console.log('🗑️ Cleaning existing data...');
    await prisma.outletOperatingHours.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.outlet.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.business.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Old data cleaned.');

    // 2. Create Users (Owners)
    console.log('👥 Creating users...');
    const hashedPassword = await BcryptUtil.hash('password123');

    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Default Owner',
                email: 'owner@example.com',
                password: hashedPassword,
                role: UserRole.OWNER,
                isVerified: true,
                phone: '+6281234567890',
            },
        }),
        prisma.user.create({
            data: {
                name: 'John Coffee',
                email: 'john@coffee.com',
                password: hashedPassword,
                role: UserRole.OWNER,
                isVerified: true,
                phone: '+6281234567891',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Sarah Food',
                email: 'sarah@food.com',
                password: hashedPassword,
                role: UserRole.OWNER,
                isVerified: true,
                phone: '+6281234567892',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Lisa Beauty',
                email: 'lisa@beauty.com',
                password: hashedPassword,
                role: UserRole.OWNER,
                isVerified: true,
                phone: '+6281234567893',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Mike Tech',
                email: 'mike@tech.com',
                password: hashedPassword,
                role: UserRole.OWNER,
                isVerified: true,
                phone: '+6281234567894',
            },
        }),
    ]);
    console.log('✅ Users created.');

    // 3. Create 5 Businesses with Wallets
    console.log('🏢 Creating 5 businesses...');
    const businesses = await Promise.all([
        prisma.business.create({
            data: {
                name: 'Kopi Nusantara',
                description: 'Kedai kopi dengan cita rasa lokal Indonesia',
                ownerId: users[0].id,
                bankName: 'Bank BCA',
                bankAccount: '1234567890',
                accountHolder: 'Default Owner',
                defaultTransactionFeeBearer: FeeBearer.CUSTOMER,
                wallet: {
                    create: {
                        balance: 2500000,
                    }
                }
            },
        }),
        prisma.business.create({
            data: {
                name: 'Warung Makan Sederhana',
                description: 'Warung makan dengan menu rumahan',
                ownerId: users[1].id,
                bankName: 'Bank Mandiri',
                bankAccount: '9876543210',
                accountHolder: 'John Coffee',
                defaultTransactionFeeBearer: FeeBearer.OWNER,
                wallet: {
                    create: {
                        balance: 1800000,
                    }
                }
            },
        }),
        prisma.business.create({
            data: {
                name: 'Salon Cantik',
                description: 'Salon kecantikan modern',
                ownerId: users[2].id,
                bankName: 'Bank BNI',
                bankAccount: '5555666677',
                accountHolder: 'Sarah Food',
                defaultTransactionFeeBearer: FeeBearer.CUSTOMER,
                wallet: {
                    create: {
                        balance: 750000,
                    }
                }
            },
        }),
        prisma.business.create({
            data: {
                name: 'Toko Elektronik Maju',
                description: 'Penjualan dan service elektronik',
                ownerId: users[3].id,
                bankName: 'Bank BRI',
                bankAccount: '1111222233',
                accountHolder: 'Lisa Beauty',
                defaultTransactionFeeBearer: FeeBearer.CUSTOMER,
                wallet: {
                    create: {
                        balance: 3000000,
                    }
                }
            },
        }),
        prisma.business.create({
            data: {
                name: 'Laundry Express',
                description: 'Layanan laundry cepat dan bersih',
                ownerId: users[4].id,
                bankName: 'Bank Danamon',
                bankAccount: '4444555566',
                accountHolder: 'Mike Tech',
                defaultTransactionFeeBearer: FeeBearer.OWNER,
                wallet: {
                    create: {
                        balance: 1200000,
                    }
                }
            },
        }),
    ]);
    console.log('✅ 5 Businesses with wallets created.');

    // 4. Create Outlets (Jakarta Selatan locations)
    console.log('🏪 Creating outlets in Jakarta Selatan...');

    // Jakarta Selatan coordinates
    const jakselLocations = [
        { name: 'Kemang', lat: -6.2665, lng: 106.8167, address: 'Jl. Kemang Raya No. 25, Jakarta Selatan' },
        { name: 'Senopati', lat: -6.2297, lng: 106.8197, address: 'Jl. Senopati No. 15, Jakarta Selatan' },
        { name: 'Blok M', lat: -6.2443, lng: 106.7993, address: 'Jl. Blok M No. 10, Jakarta Selatan' },
        { name: 'Cipete', lat: -6.2704, lng: 106.8058, address: 'Jl. Cipete Raya No. 35, Jakarta Selatan' },
        { name: 'Fatmawati', lat: -6.2914, lng: 106.7997, address: 'Jl. Fatmawati No. 20, Jakarta Selatan' },
        { name: 'Pondok Indah', lat: -6.2655, lng: 106.7808, address: 'Jl. Metro Pondok Indah No. 5, Jakarta Selatan' },
        { name: 'Tebet', lat: -6.2271, lng: 106.8569, address: 'Jl. Tebet Timur No. 12, Jakarta Selatan' },
        { name: 'Kuningan', lat: -6.2383, lng: 106.8311, address: 'Jl. Kuningan Barat No. 8, Jakarta Selatan' },
    ];

    // Outlet images based on business type
    const outletImages = {
        coffee: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000',
        food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000',
        beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000',
        electronics: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000',
        laundry: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1000'
    };

    const outlets: any[] = [];
    let locationIndex = 0;
    const businessTypesForOutlets = ['coffee', 'food', 'beauty', 'electronics', 'laundry'];

    for (let i = 0; i < businesses.length; i++) {
        const business = businesses[i];
        const businessType = businessTypesForOutlets[i];
        const outletsPerBusiness = Math.floor(Math.random() * 3) + 2; // 2-4 outlets per business

        for (let j = 0; j < outletsPerBusiness; j++) {
            if (locationIndex >= jakselLocations.length) locationIndex = 0;
            const location = jakselLocations[locationIndex];

            const outlet = await prisma.outlet.create({
                data: {
                    name: `${business.name} - ${location.name}`,
                    address: location.address,
                    phone: `+62812345${String(60000 + outlets.length).padStart(5, '0')}`,
                    isOpen: Math.random() > 0.2, // 80% chance outlet is open
                    businessId: business.id,
                    latitude: location.lat + (Math.random() - 0.5) * 0.01, // Small random offset
                    longitude: location.lng + (Math.random() - 0.5) * 0.01,
                    image: outletImages[businessType as keyof typeof outletImages]
                },
            });

            outlets.push(outlet);
            locationIndex++;
        }
    }
    console.log(`✅ ${outlets.length} outlets created in Jakarta Selatan.`);

    // 5. Create Operating Hours for each outlet
    console.log('⏰ Creating operating hours for outlets...');
    for (const outlet of outlets) {
        // Create operating hours for Monday to Sunday (0-6)
        const operatingHours = [];
        for (let day = 0; day < 7; day++) {
            const openHour = Math.floor(Math.random() * 3) + 7; // Open between 7-9 AM
            const closeHour = Math.floor(Math.random() * 3) + 19; // Close between 7-9 PM

            const openTime = new Date();
            openTime.setHours(openHour, 0, 0, 0);

            const closeTime = new Date();
            closeTime.setHours(closeHour, 0, 0, 0);

            operatingHours.push({
                dayOfWeek: day,
                openTime,
                closeTime,
                isOpen: day !== 0 || Math.random() > 0.3, // 70% chance open on Sunday
                outletId: outlet.id,
            });
        }

        await prisma.outletOperatingHours.createMany({
            data: operatingHours,
        });
    }
    console.log('✅ Operating hours created for all outlets.');

    // 6. Create Products for each outlet
    console.log('📦 Creating products for outlets...');

    const productTemplates = {
        coffee: [
            { name: 'Americano', desc: 'Kopi hitam klasik', cost: 5000, price: 15000, type: ProductType.GOODS, unit: 'cup', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1000' },
            { name: 'Cappuccino', desc: 'Kopi dengan foam susu', cost: 7000, price: 20000, type: ProductType.GOODS, unit: 'cup', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1000' },
            { name: 'Latte', desc: 'Kopi susu dengan foam art', cost: 6000, price: 18000, type: ProductType.GOODS, unit: 'cup', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000' },
            { name: 'Espresso', desc: 'Shot kopi murni', cost: 4000, price: 12000, type: ProductType.GOODS, unit: 'shot', image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=1000' },
            { name: 'Coffee Consultation', desc: 'Konsultasi kopi 1 jam', cost: 25000, price: 100000, type: ProductType.SERVICE, duration: 60, image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=1000' },
        ],
        food: [
            { name: 'Nasi Gudeg', desc: 'Nasi gudeg khas Yogya', cost: 8000, price: 25000, type: ProductType.GOODS, unit: 'porsi', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1000' },
            { name: 'Ayam Goreng', desc: 'Ayam goreng krispy', cost: 12000, price: 30000, type: ProductType.GOODS, unit: 'potong', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=1000' },
            { name: 'Gado-gado', desc: 'Salad Indonesia dengan bumbu kacang', cost: 6000, price: 20000, type: ProductType.GOODS, unit: 'porsi', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1000' },
            { name: 'Soto Ayam', desc: 'Sup ayam tradisional', cost: 7000, price: 22000, type: ProductType.GOODS, unit: 'mangkok', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000' },
            { name: 'Catering Service', desc: 'Layanan katering acara', cost: 50000, price: 200000, type: ProductType.SERVICE, duration: 240, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000' },
        ],
        beauty: [
            { name: 'Hair Cut', desc: 'Potong rambut profesional', cost: 15000, price: 50000, type: ProductType.SERVICE, duration: 45, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000' },
            { name: 'Hair Coloring', desc: 'Pewarnaan rambut', cost: 40000, price: 150000, type: ProductType.SERVICE, duration: 120, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000' },
            { name: 'Facial Treatment', desc: 'Perawatan wajah', cost: 25000, price: 80000, type: ProductType.SERVICE, duration: 60, image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1000' },
            { name: 'Manicure', desc: 'Perawatan kuku tangan', cost: 10000, price: 35000, type: ProductType.SERVICE, duration: 30, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000' },
            { name: 'Hair Vitamin', desc: 'Vitamin rambut botol', cost: 15000, price: 45000, type: ProductType.GOODS, unit: 'botol', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000' },
        ],
        electronics: [
            { name: 'Smartphone Screen', desc: 'Layar smartphone replacement', cost: 150000, price: 300000, type: ProductType.GOODS, unit: 'pcs', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000' },
            { name: 'Laptop Charger', desc: 'Charger laptop universal', cost: 80000, price: 150000, type: ProductType.GOODS, unit: 'pcs', image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?q=80&w=1000' },
            { name: 'Laptop Repair', desc: 'Service laptop rusak', cost: 50000, price: 200000, type: ProductType.SERVICE, duration: 180, image: 'https://images.unsplash.com/photo-1581092795442-6761a6b7b5bf?q=80&w=1000' },
            { name: 'Data Recovery', desc: 'Pemulihan data hilang', cost: 30000, price: 150000, type: ProductType.SERVICE, duration: 120, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000' },
            { name: 'Tech Consultation', desc: 'Konsultasi teknologi', cost: 25000, price: 100000, type: ProductType.SERVICE, duration: 60, image: 'https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?q=80&w=1000' },
        ],
        laundry: [
            { name: 'Cuci Kering', desc: 'Layanan cuci dan kering', cost: 2000, price: 8000, type: ProductType.SERVICE, duration: 180, image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1000' },
            { name: 'Cuci Setrika', desc: 'Cuci lengkap dengan setrika', cost: 3000, price: 12000, type: ProductType.SERVICE, duration: 240, image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=1000' },
            { name: 'Dry Clean', desc: 'Dry cleaning khusus', cost: 8000, price: 25000, type: ProductType.SERVICE, duration: 300, image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=1000' },
            { name: 'Sepatu Cleaning', desc: 'Cuci sepatu premium', cost: 5000, price: 20000, type: ProductType.SERVICE, duration: 120, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000' },
            { name: 'Detergen Premium', desc: 'Detergen khusus', cost: 15000, price: 35000, type: ProductType.GOODS, unit: 'botol', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=1000' },
        ],
    };

    const businessTypes = ['coffee', 'food', 'beauty', 'electronics', 'laundry'];

    for (let i = 0; i < outlets.length; i++) {
        const outlet = outlets[i];
        const businessIndex = Math.floor(i / Math.ceil(outlets.length / businesses.length));
        const businessType = businessTypes[businessIndex] || businessTypes[0];
        const templates = productTemplates[businessType as keyof typeof productTemplates];

        // Create 3-5 products per outlet
        const productsToCreate = Math.floor(Math.random() * 3) + 3;
        const selectedTemplates = templates.slice(0, productsToCreate);

        for (const template of selectedTemplates) {
            await prisma.product.create({
                data: {
                    name: template.name,
                    description: template.desc,
                    costPrice: template.cost,
                    price: template.price,
                    type: template.type,
                    quantity: template.type === ProductType.GOODS ? Math.floor(Math.random() * 100) + 20 : null,
                    unit: template.unit || null,
                    serviceDurationMinutes: template.duration || null,
                    status: ServiceStatus.ACTIVE,
                    outletId: outlet.id,
                    image: template.image,
                },
            });
        }
    }
    console.log('✅ Products created for all outlets.');

    // 7. Summary
    console.log('\n📊 SEEDING SUMMARY:');
    console.log('==================');

    const counts = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.outlet.count(),
        prisma.product.count(),
        prisma.outletOperatingHours.count(),
        prisma.wallet.count(),
    ]);

    console.log(`👥 Users: ${counts[0]}`);
    console.log(`🏢 Businesses: ${counts[1]}`);
    console.log(`🏪 Outlets: ${counts[2]}`);
    console.log(`📦 Products: ${counts[3]}`);
    console.log(`⏰ Operating Hours: ${counts[4]}`);
    console.log(`🏦 Wallets: ${counts[5]}`);

    console.log('\n🎯 FEATURES CREATED:');
    console.log('===================');
    console.log('✅ Default user account');
    console.log('✅ 5 Different business types');
    console.log('✅ Multiple outlets per business in Jakarta Selatan');
    console.log('✅ Operating hours for each outlet (Mon-Sun)');
    console.log('✅ Both GOODS and SERVICE products');
    console.log('✅ Random product quantities and pricing');

    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('====================');
    console.log('📧 owner@example.com - password: password123 (Kopi Nusantara)');
    console.log('📧 john@coffee.com - password: password123 (Warung Makan Sederhana)');
    console.log('📧 sarah@food.com - password: password123 (Salon Cantik)');
    console.log('📧 lisa@beauty.com - password: password123 (Toko Elektronik Maju)');
    console.log('📧 mike@tech.com - password: password123 (Laundry Express)');

    console.log('\n✨ Simplified database seeding completed successfully!');
}

main()
    .catch((err) => {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
