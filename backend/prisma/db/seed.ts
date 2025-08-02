import { PrismaClient, ProductType, UserRole, OrderStatus, PaymentStatus, PromoType, PromoStatus, MemberType, BookingSlotStatus, ServiceStatus, WithdrawalStatus, FeeBearer } from '@prisma/client';
import { BcryptUtil, generateOutletCode } from '../../src/utils';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive database seeding...');

    // 1. Clean existing data in proper order to avoid foreign key constraints
    console.log('🗑️ Cleaning existing data...');
    await prisma.orderItem.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.bookingSlot.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.withdrawal.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.promo.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.outlet.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.business.deleteMany({});
    await prisma.guestCustomer.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Old data cleaned.');

    // 2. Create Users (Owners)
    console.log('👥 Creating users...');
    const hashedPassword = await BcryptUtil.hash('password123');
    
    const owner1 = await prisma.user.create({
        data: {
            name: 'John Doe',
            email: 'john@coffeeshop.com',
            password: hashedPassword,
            role: UserRole.OWNER,
            isVerified: true,
            phone: '+6281234567890',
        },
    });

    const owner2 = await prisma.user.create({
        data: {
            name: 'Jane Smith',
            email: 'jane@beautysalon.com',
            password: hashedPassword,
            role: UserRole.OWNER,
            isVerified: true,
            phone: '+6281234567891',
        },
    });

    const owner3 = await prisma.user.create({
        data: {
            name: 'Mike Johnson',
            email: 'mike@techservice.com',
            password: hashedPassword,
            role: UserRole.OWNER,
            isVerified: false,
            phone: '+6281234567892',
            verificationCode: '123456',
            verificationCodeExpires: new Date(Date.now() + 3600000), // 1 hour from now
        },
    });
    console.log('✅ Users created.');

    // 3. Create Businesses with Wallets
    console.log('🏢 Creating businesses...');
    const business1 = await prisma.business.create({
        data: {
            name: 'Kopi Kenangan Jiwa',
            description: 'Kedai kopi premium dengan cita rasa autentik Indonesia',
            ownerId: owner1.id,
            bankName: 'Bank BCA',
            bankAccount: '1234567890',
            accountHolder: 'John Doe',
            defaultTransactionFeeBearer: FeeBearer.CUSTOMER,
            wallet: {
                create: {
                    balance: 2500000, // Starting balance 2.5M
                }
            }
        },
    });

    const business2 = await prisma.business.create({
        data: {
            name: 'Bella Beauty Salon',
            description: 'Salon kecantikan modern dengan layanan lengkap',
            ownerId: owner2.id,
            bankName: 'Bank Mandiri',
            bankAccount: '9876543210',
            accountHolder: 'Jane Smith',
            defaultTransactionFeeBearer: FeeBearer.OWNER,
            wallet: {
                create: {
                    balance: 1800000, // Starting balance 1.8M
                }
            }
        },
    });

    const business3 = await prisma.business.create({
        data: {
            name: 'TechFix Solutions',
            description: 'Layanan perbaikan dan konsultasi teknologi',
            ownerId: owner3.id,
            bankName: 'Bank BNI',
            bankAccount: '5555666677',
            accountHolder: 'Mike Johnson',
            defaultTransactionFeeBearer: FeeBearer.CUSTOMER,
            wallet: {
                create: {
                    balance: 750000, // Starting balance 750K
                }
            }
        },
    });
    console.log('✅ Businesses with wallets created.');

    // 4. Create Outlets
    console.log('🏪 Creating outlets...');
    const outlets = await Promise.all([
        // Coffee Shop Outlets
        prisma.outlet.create({
            data: {
                id: generateOutletCode("Kopi Kenangan Jiwa Sudirman", 16),
                name: 'Kopi Kenangan Jiwa - Sudirman',
                address: 'Jl. Jenderal Sudirman No. 1, Jakarta Pusat',
                phone: '+6281234560001',
                isOpen: true,
                businessId: business1.id,
                latitude: -6.224073878466322,
                longitude: 106.80863730039984,
                image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb'
            },
        }),
        prisma.outlet.create({
            data: {
                id: generateOutletCode("Kopi Kenangan Jiwa Thamrin", 16),
                name: 'Kopi Kenangan Jiwa - Thamrin',
                address: 'Jl. M.H. Thamrin No. 15, Jakarta Pusat',
                phone: '+6281234560002',
                isOpen: true,
                businessId: business1.id,
                latitude: -6.193857396341259,
                longitude: 106.82308775619935,
                image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24'
            },
        }),
        // Beauty Salon Outlets
        prisma.outlet.create({
            data: {
                id: generateOutletCode("Bella Beauty Kemang", 16),
                name: 'Bella Beauty - Kemang',
                address: 'Jl. Kemang Raya No. 25, Jakarta Selatan',
                phone: '+6281234560003',
                isOpen: true,
                businessId: business2.id,
                latitude: -6.266667,
                longitude: 106.816667,
                image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035'
            },
        }),
        prisma.outlet.create({
            data: {
                id: generateOutletCode("Bella Beauty PIK", 16),
                name: 'Bella Beauty - PIK',
                address: 'Pantai Indah Kapuk, Jakarta Utara',
                phone: '+6281234560004',
                isOpen: false, // This one is closed
                businessId: business2.id,
                latitude: -6.118611,
                longitude: 106.746111,
                image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e'
            },
        }),
        // Tech Service Outlet
        prisma.outlet.create({
            data: {
                id: generateOutletCode("TechFix Kelapa Gading", 16),
                name: 'TechFix - Kelapa Gading',
                address: 'Mall Kelapa Gading 3, Lt. 2, Jakarta Utara',
                phone: '+6281234560005',
                isOpen: true,
                businessId: business3.id,
                latitude: -6.158889,
                longitude: 106.908889,
                image: 'https://images.unsplash.com/photo-1581092795442-6761a6b7b5bf'
            },
        }),
    ]);
    console.log('✅ Outlets created.');

    // 5. Create Products for each outlet
    console.log('📦 Creating products...');
    
    // Coffee Shop Products
    const coffeeProducts = await Promise.all([
        // Outlet 1 - Sudirman
        prisma.product.create({
            data: {
                name: 'Kopi Susu Gula Aren', 
                description: 'Kopi susu dengan gula aren asli', 
                costPrice: 8000, 
                price: 18000, 
                type: ProductType.GOODS, 
                quantity: 100, 
                unit: 'cup', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[0].id, 
                image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d'
            }
        }),
        prisma.product.create({
            data: {
                name: 'Americano', 
                description: 'Kopi hitam klasik', 
                costPrice: 5000, 
                price: 15000, 
                type: ProductType.GOODS, 
                quantity: 150, 
                unit: 'cup', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[0].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Cappuccino', 
                description: 'Kopi dengan foam susu', 
                costPrice: 7000, 
                price: 20000, 
                type: ProductType.GOODS, 
                quantity: 80, 
                unit: 'cup', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[0].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Croissant Coklat', 
                description: 'Pastry renyah dengan filling coklat', 
                costPrice: 8000, 
                price: 22000, 
                type: ProductType.GOODS, 
                quantity: 50, 
                unit: 'pcs', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[0].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Sandwich Club', 
                description: 'Sandwich dengan ayam, sayur, dan saus', 
                costPrice: 12000, 
                price: 35000, 
                type: ProductType.GOODS, 
                quantity: 30, 
                unit: 'pcs', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[0].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Jasa Barista Private', 
                description: 'Pelatihan barista personal 2 jam', 
                costPrice: 50000, 
                price: 150000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 120, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[0].id
            }
        }),
        
        // Outlet 2 - Thamrin
        prisma.product.create({
            data: {
                name: 'Espresso', 
                description: 'Shot kopi murni', 
                costPrice: 4000, 
                price: 12000, 
                type: ProductType.GOODS, 
                quantity: 200, 
                unit: 'shot', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[1].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Latte', 
                description: 'Kopi susu dengan foam art', 
                costPrice: 6000, 
                price: 18000, 
                type: ProductType.GOODS, 
                quantity: 120, 
                unit: 'cup', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[1].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Matcha Latte', 
                description: 'Minuman matcha dengan susu', 
                costPrice: 8000, 
                price: 25000, 
                type: ProductType.GOODS, 
                quantity: 60, 
                unit: 'cup', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[1].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Donat Gula', 
                description: 'Donat klasik dengan gula halus', 
                costPrice: 3000, 
                price: 10000, 
                type: ProductType.GOODS, 
                quantity: 70, 
                unit: 'pcs', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[1].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Muffin Blueberry', 
                description: 'Muffin dengan blueberry segar', 
                costPrice: 5000, 
                price: 18000, 
                type: ProductType.GOODS, 
                quantity: 40, 
                unit: 'pcs', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[1].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Coffee Cupping Session', 
                description: 'Sesi degustasi kopi premium 1.5 jam', 
                costPrice: 75000, 
                price: 200000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 90, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[1].id
            }
        }),
    ]);

    // Beauty Salon Products
    const beautyProducts = await Promise.all([
        // Outlet 3 - Kemang
        prisma.product.create({
            data: {
                name: 'Hair Cut & Style', 
                description: 'Potong rambut dengan styling', 
                costPrice: 25000, 
                price: 80000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 60, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[2].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Hair Coloring', 
                description: 'Pewarnaan rambut profesional', 
                costPrice: 50000, 
                price: 200000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 180, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[2].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Facial Treatment', 
                description: 'Perawatan wajah lengkap', 
                costPrice: 30000, 
                price: 120000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 90, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[2].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Manicure Pedicure', 
                description: 'Perawatan kuku tangan dan kaki', 
                costPrice: 20000, 
                price: 75000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 75, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[2].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Hair Mask Treatment', 
                description: 'Masker rambut untuk nutrisi extra', 
                costPrice: 15000, 
                price: 60000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 45, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[2].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Eyebrow Shaping', 
                description: 'Pembentukan alis profesional', 
                costPrice: 10000, 
                price: 45000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 30, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[2].id
            }
        }),
        
        // Outlet 4 - PIK (Closed outlet)
        prisma.product.create({
            data: {
                name: 'Premium Facial', 
                description: 'Facial dengan produk premium', 
                costPrice: 50000, 
                price: 180000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 120, 
                status: ServiceStatus.INACTIVE, 
                outletId: outlets[3].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Hair Spa Package', 
                description: 'Paket perawatan rambut lengkap', 
                costPrice: 40000, 
                price: 150000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 150, 
                status: ServiceStatus.INACTIVE, 
                outletId: outlets[3].id
            }
        }),
    ]);

    // Tech Service Products
    const techProducts = await Promise.all([
        // Outlet 5 - Kelapa Gading
        prisma.product.create({
            data: {
                name: 'Laptop Repair Service', 
                description: 'Perbaikan laptop berbagai merk', 
                costPrice: 25000, 
                price: 100000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 240, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[4].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Smartphone Screen Replacement', 
                description: 'Ganti layar smartphone', 
                costPrice: 150000, 
                price: 300000, 
                type: ProductType.GOODS, 
                quantity: 20, 
                unit: 'pcs', 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[4].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Data Recovery Service', 
                description: 'Pemulihan data yang hilang', 
                costPrice: 50000, 
                price: 200000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 180, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[4].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Virus Removal & Cleanup', 
                description: 'Pembersihan virus dan optimasi sistem', 
                costPrice: 15000, 
                price: 75000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 120, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[4].id
            }
        }),
        prisma.product.create({
            data: {
                name: 'Tech Consultation', 
                description: 'Konsultasi teknologi 1 jam', 
                costPrice: 25000, 
                price: 100000, 
                type: ProductType.SERVICE, 
                serviceDurationMinutes: 60, 
                status: ServiceStatus.ACTIVE, 
                outletId: outlets[4].id
            }
        }),
    ]);

    // Combine all products
    const products = [...coffeeProducts, ...beautyProducts, ...techProducts];
    console.log('✅ Products created.');

    // 6. Create Guest Customers
    console.log('🙋 Creating guest customers...');
    const guestCustomers = await Promise.all([
        prisma.guestCustomer.create({
            data: { name: 'Alice Johnson', email: 'alice.johnson@gmail.com', phone: '+6285611112222' }
        }),
        prisma.guestCustomer.create({
            data: { name: 'Bob Smith', email: 'bob.smith@yahoo.com', phone: '+6285733334444' }
        }),
        prisma.guestCustomer.create({
            data: { name: 'Charlie Brown', email: 'charlie.brown@outlook.com', phone: '+6285655556666' }
        }),
        prisma.guestCustomer.create({
            data: { name: 'Diana Prince', email: 'diana.prince@gmail.com', phone: '+6285777788899' }
        }),
        prisma.guestCustomer.create({
            data: { name: 'Edward Norton', email: 'edward.norton@hotmail.com', phone: '+6285999900011' }
        }),
        prisma.guestCustomer.create({
            data: { name: 'Fiona Green', email: 'fiona.green@gmail.com', phone: '+6285111122334' }
        }),
    ]);
    console.log('✅ Guest customers created.');

    // 7. Create Promos
    console.log('🎁 Creating promos...');
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const pastDate = new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

    const promos = await Promise.all([
        // Business 1 - Coffee Shop Promos
        prisma.promo.create({
            data: {
                code: 'WELCOME20',
                description: 'Diskon 20% untuk pelanggan baru',
                type: PromoType.PERCENTAGE,
                value: 20,
                status: PromoStatus.ACTIVE,
                maxUses: 100,
                timesUsed: 15,
                minPurchaseAmount: 50000,
                validFrom: currentDate,
                validUntil: futureDate,
                businessId: business1.id,
            }
        }),
        prisma.promo.create({
            data: {
                code: 'HEMAT25K',
                description: 'Potongan Rp 25.000 minimal pembelian Rp 100.000',
                type: PromoType.FIXED_AMOUNT,
                value: 25000,
                status: PromoStatus.ACTIVE,
                maxUses: 50,
                timesUsed: 8,
                minPurchaseAmount: 100000,
                validFrom: currentDate,
                validUntil: futureDate,
                businessId: business1.id,
            }
        }),
        prisma.promo.create({
            data: {
                code: 'EXPIRED10',
                description: 'Promo sudah expired',
                type: PromoType.PERCENTAGE,
                value: 10,
                status: PromoStatus.EXPIRED,
                maxUses: 20,
                timesUsed: 20,
                minPurchaseAmount: 30000,
                validFrom: pastDate,
                validUntil: pastDate,
                businessId: business1.id,
            }
        }),
        // Business 2 - Beauty Salon Promos
        prisma.promo.create({
            data: {
                code: 'BEAUTY15',
                description: 'Diskon 15% untuk semua treatment',
                type: PromoType.PERCENTAGE,
                value: 15,
                status: PromoStatus.ACTIVE,
                maxUses: 30,
                timesUsed: 5,
                minPurchaseAmount: 80000,
                validFrom: currentDate,
                validUntil: futureDate,
                businessId: business2.id,
            }
        }),
        prisma.promo.create({
            data: {
                code: 'CANTIK50K',
                description: 'Cashback Rp 50.000 minimal treatment Rp 200.000',
                type: PromoType.FIXED_AMOUNT,
                value: 50000,
                status: PromoStatus.ACTIVE,
                maxUses: 25,
                timesUsed: 3,
                minPurchaseAmount: 200000,
                validFrom: currentDate,
                validUntil: futureDate,
                businessId: business2.id,
            }
        }),
        // Business 3 - Tech Service Promos
        prisma.promo.create({
            data: {
                code: 'TECHFIX30',
                description: 'Diskon 30% untuk perbaikan pertama',
                type: PromoType.PERCENTAGE,
                value: 30,
                status: PromoStatus.ACTIVE,
                maxUses: 15,
                timesUsed: 2,
                minPurchaseAmount: 75000,
                validFrom: currentDate,
                validUntil: futureDate,
                businessId: business3.id,
            }
        }),
    ]);
    console.log('✅ Promos created.');

    // 8. Create Memberships
    console.log('👑 Creating memberships...');
    await prisma.membership.createMany({
        data: [
            // Business 1 memberships
            {
                memberCode: 'COFFEE001',
                memberType: MemberType.VIP,
                discountPercentage: 10,
                isActive: true,
                notes: 'Member VIP pertama',
                guestCustomerId: guestCustomers[0].id,
                businessId: business1.id,
            },
            {
                memberCode: 'COFFEE002',
                memberType: MemberType.REGULAR,
                discountPercentage: 5,
                isActive: true,
                guestCustomerId: guestCustomers[1].id,
                businessId: business1.id,
            },
            {
                memberCode: 'COFFEE003',
                memberType: MemberType.PREMIUM,
                discountPercentage: 15,
                isActive: true,
                notes: 'Member premium dengan benefit khusus',
                guestCustomerId: guestCustomers[2].id,
                businessId: business1.id,
            },
            // Business 2 memberships
            {
                memberCode: 'BEAUTY001',
                memberType: MemberType.VIP,
                discountPercentage: 12,
                isActive: true,
                guestCustomerId: guestCustomers[3].id,
                businessId: business2.id,
            },
            {
                memberCode: 'BEAUTY002',
                memberType: MemberType.REGULAR,
                discountPercentage: 7,
                isActive: false,
                notes: 'Member tidak aktif sementara',
                guestCustomerId: guestCustomers[4].id,
                businessId: business2.id,
            },
            // Business 3 memberships
            {
                memberCode: 'TECH001',
                memberType: MemberType.PREMIUM,
                discountPercentage: 20,
                isActive: true,
                notes: 'Corporate member',
                guestCustomerId: guestCustomers[5].id,
                businessId: business3.id,
            },
        ],
    });
    console.log('✅ Memberships created.');

    // 9. Create Orders with various statuses
    console.log('🛒 Creating orders...');

    // Coffee shop orders
    const order1 = await prisma.order.create({
        data: {
            totalAmount: 53000,
            paymentStatus: PaymentStatus.SUCCESS,
            orderStatus: OrderStatus.COMPLETED,
            midtransFee: 371, // 0.7% of 53000
            appFee: 1060, // 2% of 53000
            chargedTo: FeeBearer.CUSTOMER,
            promoId: promos.find(p => p.code === 'WELCOME20')?.id,
            discountAmount: 10600, // 20% discount applied
            guestCustomerId: guestCustomers[0].id,
            outletId: outlets[0].id,
        },
    });

    const order2 = await prisma.order.create({
        data: {
            totalAmount: 75000,
            paymentStatus: PaymentStatus.PENDING,
            orderStatus: OrderStatus.AWAITING_PAYMENT,
            midtransFee: 525,
            appFee: 1500,
            chargedTo: FeeBearer.CUSTOMER,
            paymentReminderSent: false,
            guestCustomerId: guestCustomers[1].id,
            outletId: outlets[1].id,
            midtransTransactionToken: 'snap-token-123456',
            midtransRedirectUrl: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123456',
        },
    });

    const order3 = await prisma.order.create({
        data: {
            totalAmount: 150000,
            bookingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            paymentStatus: PaymentStatus.SUCCESS,
            orderStatus: OrderStatus.CONFIRMED,
            midtransFee: 1050,
            appFee: 3000,
            chargedTo: FeeBearer.OWNER,
            guestCustomerId: guestCustomers[2].id,
            outletId: outlets[0].id,
        },
    });

    // Beauty salon orders
    const order4 = await prisma.order.create({
        data: {
            totalAmount: 195000,
            bookingDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
            paymentStatus: PaymentStatus.SUCCESS,
            orderStatus: OrderStatus.PROCESSING,
            midtransFee: 1365,
            appFee: 3900,
            chargedTo: FeeBearer.CUSTOMER,
            promoId: promos.find(p => p.code === 'BEAUTY15')?.id,
            discountAmount: 29250, // 15% discount
            guestCustomerId: guestCustomers[3].id,
            outletId: outlets[2].id,
        },
    });

    const order5 = await prisma.order.create({
        data: {
            totalAmount: 120000,
            paymentStatus: PaymentStatus.FAILED,
            orderStatus: OrderStatus.CANCELLED,
            midtransFee: 840,
            appFee: 2400,
            chargedTo: FeeBearer.CUSTOMER,
            guestCustomerId: guestCustomers[4].id,
            outletId: outlets[2].id,
        },
    });

    // Tech service orders
    const order6 = await prisma.order.create({
        data: {
            totalAmount: 175000,
            paymentStatus: PaymentStatus.SUCCESS,
            orderStatus: OrderStatus.READY,
            midtransFee: 1225,
            appFee: 3500,
            chargedTo: FeeBearer.CUSTOMER,
            promoId: promos.find(p => p.code === 'TECHFIX30')?.id,
            discountAmount: 52500, // 30% discount
            guestCustomerId: guestCustomers[5].id,
            outletId: outlets[4].id,
        },
    });

    const orders = [order1, order2, order3, order4, order5, order6];
    console.log('✅ Orders created.');

    // 10. Create Order Items
    console.log('📝 Creating order items...');
    await prisma.orderItem.createMany({
        data: [
            // Order 1 items (Coffee)
            { orderId: order1.id, productId: coffeeProducts[0].id, quantity: 2, priceAtTimeOfOrder: 18000 },
            { orderId: order1.id, productId: coffeeProducts[3].id, quantity: 1, priceAtTimeOfOrder: 22000 },
            
            // Order 2 items (Coffee)
            { orderId: order2.id, productId: coffeeProducts[6].id, quantity: 1, priceAtTimeOfOrder: 12000 },
            { orderId: order2.id, productId: coffeeProducts[7].id, quantity: 2, priceAtTimeOfOrder: 18000 },
            { orderId: order2.id, productId: coffeeProducts[9].id, quantity: 3, priceAtTimeOfOrder: 10000 },
            
            // Order 3 items (Coffee service)
            { orderId: order3.id, productId: coffeeProducts[5].id, quantity: 1, priceAtTimeOfOrder: 150000 },
            
            // Order 4 items (Beauty)
            { orderId: order4.id, productId: beautyProducts[1].id, quantity: 1, priceAtTimeOfOrder: 200000 },
            { orderId: order4.id, productId: beautyProducts[3].id, quantity: 1, priceAtTimeOfOrder: 75000 },
            
            // Order 5 items (Beauty)
            { orderId: order5.id, productId: beautyProducts[2].id, quantity: 1, priceAtTimeOfOrder: 120000 },
            
            // Order 6 items (Tech)
            { orderId: order6.id, productId: techProducts[0].id, quantity: 1, priceAtTimeOfOrder: 100000 },
            { orderId: order6.id, productId: techProducts[3].id, quantity: 1, priceAtTimeOfOrder: 75000 },
        ],
    });
    console.log('✅ Order items created.');

    // 11. Create Transactions for completed orders
    console.log('💳 Creating transactions...');
    await prisma.transaction.createMany({
        data: [
            {
                amount: 53000,
                paymentMethod: 'qris',
                status: PaymentStatus.SUCCESS,
                externalId: 'midtrans-txn-001',
                paymentUrl: null, // Already paid
                expiresAt: null,
                orderId: order1.id,
            },
            {
                amount: 75000,
                paymentMethod: 'gopay',
                status: PaymentStatus.PENDING,
                externalId: 'midtrans-txn-002',
                paymentUrl: 'https://api.sandbox.midtrans.com/v2/gopay/123456/qr-code',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                orderId: order2.id,
            },
            {
                amount: 150000,
                paymentMethod: 'bank_transfer',
                status: PaymentStatus.SUCCESS,
                externalId: 'midtrans-txn-003',
                paymentUrl: null,
                expiresAt: null,
                orderId: order3.id,
            },
            {
                amount: 195000,
                paymentMethod: 'qris',
                status: PaymentStatus.SUCCESS,
                externalId: 'midtrans-txn-004',
                paymentUrl: null,
                expiresAt: null,
                orderId: order4.id,
            },
            {
                amount: 120000,
                paymentMethod: 'credit_card',
                status: PaymentStatus.FAILED,
                externalId: 'midtrans-txn-005',
                paymentUrl: null,
                expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Expired 2 hours ago
                orderId: order5.id,
            },
            {
                amount: 175000,
                paymentMethod: 'dana',
                status: PaymentStatus.SUCCESS,
                externalId: 'midtrans-txn-006',
                paymentUrl: null,
                expiresAt: null,
                orderId: order6.id,
            },
        ],
    });
    console.log('✅ Transactions created.');

    // 12. Create Booking Slots for service products
    console.log('📅 Creating booking slots...');
    const serviceProducts = products.filter(p => p.type === ProductType.SERVICE);
    const today = new Date();
    const bookingSlots = [];

    for (const product of serviceProducts) {
        // Create slots for next 7 days
        for (let day = 0; day < 7; day++) {
            const slotDate = new Date(today);
            slotDate.setDate(today.getDate() + day);
            slotDate.setHours(0, 0, 0, 0);

            // Create multiple time slots per day (9 AM to 5 PM)
            const timeSlots = [
                { start: 9, end: 9 + (product.serviceDurationMinutes || 60) / 60 },
                { start: 11, end: 11 + (product.serviceDurationMinutes || 60) / 60 },
                { start: 13, end: 13 + (product.serviceDurationMinutes || 60) / 60 },
                { start: 15, end: 15 + (product.serviceDurationMinutes || 60) / 60 },
                { start: 17, end: 17 + (product.serviceDurationMinutes || 60) / 60 },
            ];

            for (const timeSlot of timeSlots) {
                const startTime = new Date(slotDate);
                startTime.setHours(timeSlot.start, 0, 0, 0);
                
                const endTime = new Date(slotDate);
                endTime.setHours(Math.floor(timeSlot.end), (timeSlot.end % 1) * 60, 0, 0);

                // Skip past time slots
                if (startTime < new Date()) continue;

                let status = BookingSlotStatus.AVAILABLE;
                let orderId = null;

                // Book some random slots
                // if (Math.random() < 0.3) { // 30% chance of being booked
                //     status = BookingSlotStatus.BOOKED;
                //     // Find a suitable order (should be more sophisticated in real app)
                //     const suitableOrder = orders.find(o => 
                //         o.bookingDate && 
                //         Math.abs(o.bookingDate.getTime() - startTime.getTime()) < 24 * 60 * 60 * 1000
                //     );
                //     if (suitableOrder) {
                //         orderId = suitableOrder.id;
                //     }
                // } else if (Math.random() < 0.1) { // 10% chance of being blocked
                //     status = BookingSlotStatus.BLOCKED;
                // }

                bookingSlots.push({
                    date: slotDate,
                    startTime,
                    endTime,
                    status,
                    productId: product.id,
                    orderId,
                });
            }
        }
    }

    await prisma.bookingSlot.createMany({
        data: bookingSlots,
    });
    console.log('✅ Booking slots created.');

    // 13. Create Expenses
    console.log('💸 Creating expenses...');
    const expenseData = [];
    
    for (const outlet of outlets) {
        // Create various expenses for each outlet
        const baseExpenses = [
            { description: 'Sewa tempat bulan ini', amount: 5000000 },
            { description: 'Listrik dan air', amount: 800000 },
            { description: 'Gaji karyawan', amount: 3500000 },
            { description: 'Pembelian bahan baku', amount: 1200000 },
            { description: 'Maintenance peralatan', amount: 350000 },
        ];

        for (let i = 0; i < baseExpenses.length; i++) {
            const expense = baseExpenses[i];
            const expenseDate = new Date();
            expenseDate.setDate(expenseDate.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days

            expenseData.push({
                description: expense.description,
                amount: expense.amount + (Math.random() - 0.5) * expense.amount * 0.2, // ±20% variation
                date: expenseDate,
                outletId: outlet.id,
            });
        }
    }

    await prisma.expense.createMany({
        data: expenseData,
    });
    console.log('✅ Expenses created.');

    // 14. Create Withdrawals
    console.log('💰 Creating withdrawals...');
    await prisma.withdrawal.createMany({
        data: [
            // Business 1 withdrawals
            {
                requestedAmount: 1000000,
                midtransFee: 4000,
                appFee: 20000, // 2% of 1M
                finalAmount: 976000,
                status: WithdrawalStatus.COMPLETED,
                notes: 'Penarikan rutin mingguan',
                midtransReference: 'WD-001-20240801',
                businessId: business1.id,
                processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            },
            {
                requestedAmount: 500000,
                midtransFee: 4000,
                appFee: 10000,
                finalAmount: 486000,
                status: WithdrawalStatus.PROCESSING,
                notes: 'Untuk modal tambahan',
                midtransReference: 'WD-002-20240802',
                businessId: business1.id,
            },
            
            // Business 2 withdrawals
            {
                requestedAmount: 750000,
                midtransFee: 4000,
                appFee: 15000,
                finalAmount: 731000,
                status: WithdrawalStatus.COMPLETED,
                notes: 'Pembayaran supplier',
                midtransReference: 'WD-003-20240730',
                businessId: business2.id,
                processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            },
            {
                requestedAmount: 300000,
                midtransFee: 4000,
                appFee: 6000,
                finalAmount: 290000,
                status: WithdrawalStatus.REJECTED,
                notes: 'Saldo tidak mencukupi',
                businessId: business2.id,
            },
            
            // Business 3 withdrawals
            {
                requestedAmount: 200000,
                midtransFee: 4000,
                appFee: 4000,
                finalAmount: 192000,
                status: WithdrawalStatus.PENDING,
                notes: 'Penariran pertama',
                businessId: business3.id,
            },
        ],
    });
    console.log('✅ Withdrawals created.');

    // 15. Update promo usage counts based on orders
    console.log('🔄 Updating promo usage counts...');
    const welcomePromo = promos.find(p => p.code === 'WELCOME20');
    const beautyPromo = promos.find(p => p.code === 'BEAUTY15');
    const techPromo = promos.find(p => p.code === 'TECHFIX30');

    if (welcomePromo) {
        await prisma.promo.update({
            where: { id: welcomePromo.id },
            data: { timesUsed: { increment: 1 } },
        });
    }

    if (beautyPromo) {
        await prisma.promo.update({
            where: { id: beautyPromo.id },
            data: { timesUsed: { increment: 1 } },
        });
    }

    if (techPromo) {
        await prisma.promo.update({
            where: { id: techPromo.id },
            data: { timesUsed: { increment: 1 } },
        });
    }

    // 16. Update product quantities based on completed orders
    console.log('📦 Updating product stock...');
    // Reduce stock for goods that have been sold
    const completedOrderItems = await prisma.orderItem.findMany({
        where: {
            order: {
                orderStatus: OrderStatus.COMPLETED,
            },
        },
        include: {
            product: true,
        },
    });

    for (const item of completedOrderItems) {
        if (item.product.type === ProductType.GOODS && item.product.quantity !== null) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    quantity: Math.max(0, item.product.quantity - item.quantity),
                },
            });
        }
    }

    // 17. Summary
    console.log('\n📊 SEEDING SUMMARY:');
    console.log('==================');
    
    const counts = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.outlet.count(),
        prisma.product.count(),
        prisma.guestCustomer.count(),
        prisma.order.count(),
        prisma.orderItem.count(),
        prisma.transaction.count(),
        prisma.promo.count(),
        prisma.membership.count(),
        prisma.bookingSlot.count(),
        prisma.expense.count(),
        prisma.withdrawal.count(),
        prisma.wallet.count(),
    ]);

    console.log(`👥 Users (Owners): ${counts[0]}`);
    console.log(`🏢 Businesses: ${counts[1]}`);
    console.log(`🏪 Outlets: ${counts[2]}`);
    console.log(`📦 Products: ${counts[3]}`);
    console.log(`🙋 Guest Customers: ${counts[4]}`);
    console.log(`🛒 Orders: ${counts[5]}`);
    console.log(`📝 Order Items: ${counts[6]}`);
    console.log(`💳 Transactions: ${counts[7]}`);
    console.log(`🎁 Promos: ${counts[8]}`);
    console.log(`👑 Memberships: ${counts[9]}`);
    console.log(`📅 Booking Slots: ${counts[10]}`);
    console.log(`💸 Expenses: ${counts[11]}`);
    console.log(`💰 Withdrawals: ${counts[12]}`);
    console.log(`🏦 Wallets: ${counts[13]}`);

    console.log('\n🎯 TEST SCENARIOS CREATED:');
    console.log('=========================');
    console.log('✅ 3 Different business types (Coffee, Beauty, Tech)');
    console.log('✅ Multiple outlets per business');
    console.log('✅ Both GOODS and SERVICE products');
    console.log('✅ Orders with various statuses (PENDING, SUCCESS, FAILED, etc.)');
    console.log('✅ Active and inactive promos');
    console.log('✅ Different member types (REGULAR, VIP, PREMIUM)');
    console.log('✅ Booking slots for service products');
    console.log('✅ Expenses tracking per outlet');
    console.log('✅ Withdrawal requests with different statuses');
    console.log('✅ Complete order flow with transactions');
    console.log('✅ Fee bearer variations (CUSTOMER vs OWNER)');

    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('====================');
    console.log('📧 john@coffeeshop.com (Coffee Business) - password: password123');
    console.log('📧 jane@beautysalon.com (Beauty Business) - password: password123');
    console.log('📧 mike@techservice.com (Tech Business) - password: password123');

    console.log('\n✨ Database seeding completed successfully!');
}

main()
    .catch((err) => {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
