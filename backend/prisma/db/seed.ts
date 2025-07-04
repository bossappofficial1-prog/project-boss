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
        phone: '081234567890',
        avatar: 'https://ui-avatars.com/api/?name=Ahmad+Rizki&background=0D8ABC&color=fff',
    },
    {
        id: 'user-customer-2',
        email: 'customer2@example.com',
        name: 'Siti Aminah',
        password: 'password123',
        role: 'CUSTOMER',
        isVerified: true,
        phone: '081234567891',
        avatar: 'https://ui-avatars.com/api/?name=Siti+Aminah&background=0D8ABC&color=fff',
    },
    {
        id: 'user-customer-3',
        email: 'customer3@example.com',
        name: 'Rudi Hartanto',
        password: 'password123',
        role: 'CUSTOMER',
        isVerified: true,
        phone: '081234567892',
        avatar: 'https://ui-avatars.com/api/?name=Rudi+Hartanto&background=0D8ABC&color=fff',
    },
    {
        id: 'user-customer-4',
        email: 'customer4@example.com',
        name: 'Maya Sari',
        password: 'password123',
        role: 'CUSTOMER',
        isVerified: false,
        phone: '081234567893',
        avatar: 'https://ui-avatars.com/api/?name=Maya+Sari&background=0D8ABC&color=fff',
    },
    {
        id: 'user-owner-1',
        email: 'owner1@example.com',
        name: 'Budi Santoso',
        password: 'password123',
        role: 'OWNER',
        isVerified: true,
        phone: '081234567894',
        avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=DC2626&color=fff',
    },
    {
        id: 'user-owner-2',
        email: 'owner2@example.com',
        name: 'Dewi Lestari',
        password: 'password123',
        role: 'OWNER',
        isVerified: true,
        phone: '081234567895',
        avatar: 'https://ui-avatars.com/api/?name=Dewi+Lestari&background=DC2626&color=fff',
    },
    {
        id: 'user-owner-3',
        email: 'owner3@example.com',
        name: 'Joko Widodo',
        password: 'password123',
        role: 'OWNER',
        isVerified: true,
        phone: '081234567896',
        avatar: 'https://ui-avatars.com/api/?name=Joko+Widodo&background=DC2626&color=fff',
    },
];

const businessData = [
    {
        id: 'business-1',
        name: 'Warung Makan Bu Budi',
        description: 'Warung makan tradisional dengan cita rasa autentik khas Jawa. Menyajikan berbagai makanan tradisional dengan bumbu rempah pilihan.',
        bankName: 'BCA',
        bankAccount: '1234567890',
        accountHolder: 'Budi Santoso',
        ownerId: 'user-owner-1',
        defaultTransactionFeeBearer: 'OWNER',
    },
    {
        id: 'business-2',
        name: 'Salon Kecantikan Dewi',
        description: 'Salon lengkap untuk perawatan kecantikan wanita dengan teknologi terkini dan produk berkualitas premium.',
        bankName: 'Mandiri',
        bankAccount: '0987654321',
        accountHolder: 'Dewi Lestari',
        ownerId: 'user-owner-2',
        defaultTransactionFeeBearer: 'CUSTOMER',
    },
    {
        id: 'business-3',
        name: 'Bengkel Motor Joko',
        description: 'Bengkel motor terpercaya dengan mekanik berpengalaman dan suku cadang original.',
        bankName: 'BRI',
        bankAccount: '1122334455',
        accountHolder: 'Joko Widodo',
        ownerId: 'user-owner-3',
        defaultTransactionFeeBearer: 'OWNER',
    },
];

const outletNames = [
    'Cabang Pusat', 'Cabang Timur', 'Cabang Barat', 'Cabang Utara', 'Cabang Selatan'
];

const foodProducts = [
    { name: 'Nasi Gudeg', description: 'Nasi gudeg khas Yogyakarta dengan cita rasa manis dan gurih', price: 15000, costPrice: 8000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400' },
    { name: 'Ayam Bakar', description: 'Ayam bakar bumbu kecap dengan sambal terasi', price: 20000, costPrice: 12000, image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400' },
    { name: 'Gado-gado', description: 'Gado-gado dengan bumbu kacang khas Jakarta', price: 12000, costPrice: 6000, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400' },
    { name: 'Soto Ayam', description: 'Soto ayam kuah bening dengan rempah tradisional', price: 13000, costPrice: 7000, image: 'https://images.unsplash.com/photo-1583032015870-403d9c5ad605?w=400' },
    { name: 'Rendang Daging', description: 'Rendang daging sapi pedas khas Padang', price: 25000, costPrice: 15000, image: 'https://images.unsplash.com/photo-1565299585323-38174c59f7f7?w=400' },
    { name: 'Es Teh Manis', description: 'Es teh manis segar dengan gula aren', price: 3000, costPrice: 1000, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400' },
    { name: 'Jus Jeruk', description: 'Jus jeruk segar tanpa gula tambahan', price: 8000, costPrice: 4000, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400' },
    { name: 'Kerupuk Udang', description: 'Kerupuk udang renyah buatan rumah', price: 5000, costPrice: 2000, image: 'https://images.unsplash.com/photo-1582049165035-e5309c3b8c7c?w=400' },
    { name: 'Sambal Terasi', description: 'Sambal terasi pedas level tinggi', price: 2000, costPrice: 500, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400' },
    { name: 'Nasi Putih', description: 'Nasi putih hangat premium', price: 4000, costPrice: 1500, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
];

const beautyServices = [
    { name: 'Potong Rambut Wanita', description: 'Potong rambut sesuai model terkini dengan stylist profesional', price: 50000, costPrice: 15000, duration: 60, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400' },
    { name: 'Creambath', description: 'Perawatan rambut dengan cream khusus untuk nutrisi mendalam', price: 75000, costPrice: 25000, duration: 90, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400' },
    { name: 'Facial Acne', description: 'Perawatan wajah khusus untuk kulit berjerawat', price: 100000, costPrice: 40000, duration: 120, image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400' },
    { name: 'Manicure Pedicure', description: 'Perawatan kuku tangan dan kaki lengkap', price: 60000, costPrice: 20000, duration: 75, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400' },
    { name: 'Hair Styling', description: 'Styling rambut untuk acara khusus', price: 80000, costPrice: 25000, duration: 45, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400' },
    { name: 'Waxing Kaki', description: 'Waxing untuk kaki halus dan bersih', price: 90000, costPrice: 30000, duration: 60, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400' },
    { name: 'Eyebrow Shaping', description: 'Rapikan bentuk alis sesuai bentuk wajah', price: 35000, costPrice: 10000, duration: 30, image: 'https://images.unsplash.com/photo-1588599077148-e7c6e8b0b19b?w=400' },
    { name: 'Hair Coloring', description: 'Pewarnaan rambut profesional dengan produk berkualitas', price: 150000, costPrice: 60000, duration: 180, image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400' },
    { name: 'Deep Cleansing', description: 'Pembersihan wajah mendalam untuk kulit bersih', price: 85000, costPrice: 35000, duration: 90, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400' },
    { name: 'Hair Rebonding', description: 'Pelurusan rambut permanen dengan hasil natural', price: 200000, costPrice: 80000, duration: 240, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400' },
];

const mechanicServices = [
    { name: 'Ganti Oli Mesin', description: 'Penggantian oli mesin dengan oli berkualitas tinggi', price: 50000, costPrice: 25000, duration: 30, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400' },
    { name: 'Tune Up Motor', description: 'Tune up lengkap untuk performa motor optimal', price: 75000, costPrice: 35000, duration: 60, image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
    { name: 'Servis Rem', description: 'Servis sistem rem untuk keamanan berkendara', price: 80000, costPrice: 40000, duration: 45, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400' },
    { name: 'Ganti Ban', description: 'Penggantian ban motor dengan ban berkualitas', price: 200000, costPrice: 150000, duration: 30, image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
    { name: 'Servis Rantai', description: 'Perawatan dan penyetelan rantai motor', price: 25000, costPrice: 10000, duration: 20, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400' },
    { name: 'Ganti Kampas Rem', description: 'Penggantian kampas rem depan dan belakang', price: 60000, costPrice: 35000, duration: 40, image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
    { name: 'Servis Karburator', description: 'Pembersihan dan penyetelan karburator', price: 45000, costPrice: 20000, duration: 50, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400' },
    { name: 'Ganti Aki', description: 'Penggantian aki motor dengan aki kering berkualitas', price: 120000, costPrice: 90000, duration: 15, image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
];

const guestCustomerData = [
    {
        id: 'guest-1',
        name: 'Andi Setiawan',
        email: 'andi@example.com',
        phone: '081234567800',
    },
    {
        id: 'guest-2',
        name: 'Rina Wijaya',
        email: 'rina@example.com',
        phone: '081234567801',
    },
    {
        id: 'guest-3',
        name: 'Hendra Kusuma',
        email: null,
        phone: '081234567802',
    },
];

const membershipData = [
    {
        customerId: 'user-customer-1',
        businessId: 'business-1',
        memberCode: 'WMB001',
        memberType: 'VIP',
        discountPercentage: 10,
    },
    {
        customerId: 'user-customer-2',
        businessId: 'business-2',
        memberCode: 'SKD001',
        memberType: 'PREMIUM',
        discountPercentage: 15,
    },
    {
        customerId: 'user-customer-3',
        businessId: 'business-1',
        memberCode: 'WMB002',
        memberType: 'REGULAR',
        discountPercentage: 5,
    },
    {
        customerId: 'user-customer-1',
        businessId: 'business-3',
        memberCode: 'BMJ001',
        memberType: 'VIP',
        discountPercentage: 12,
    },
];

async function createBookingSlots(productId: any, product: any) {
    const slots = [];
    const today = new Date();

    // Create slots for next 30 days
    for (let day = 0; day < 30; day++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + day);

        // Create slots from 9:00 to 17:00 (working hours)
        const startHour = 9;
        const endHour = 17;
        const serviceDuration = product.serviceDurationMinutes || 60;

        for (let hour = startHour; hour < endHour; hour++) {
            const slotsPerHour = Math.floor(60 / serviceDuration);

            for (let slot = 0; slot < slotsPerHour; slot++) {
                const startTime = new Date(slotDate);
                startTime.setHours(hour, slot * serviceDuration, 0, 0);

                const endTime = new Date(startTime);
                endTime.setMinutes(startTime.getMinutes() + serviceDuration);

                // Skip if end time exceeds working hours
                if (endTime.getHours() >= endHour) continue;

                slots.push({
                    id: `slot-${productId}-${day}-${hour}-${slot}`,
                    productId: productId,
                    date: slotDate,
                    startTime: startTime,
                    endTime: endTime,
                    status: Math.random() > 0.8 ? 'BLOCKED' : 'AVAILABLE', // 20% chance blocked
                });
            }
        }
    }

    return slots;
}

async function createSampleOrders() {
    const orders = [];
    const outlets = await db.outlet.findMany({
        include: {
            products: true,
            business: true,
        },
    });

    const customers = await db.user.findMany({
        where: { role: 'CUSTOMER' },
    });

    const guestCustomers = await db.guestCustomer.findMany();

    // Create 20 sample orders
    for (let i = 0; i < 20; i++) {
        const outlet = outlets[Math.floor(Math.random() * outlets.length)];
        const isGuestOrder = Math.random() > 0.7; // 30% chance for guest orders

        let customerId = null;
        let guestCustomerId = null;
        let customerType = 'REGISTERED';

        if (isGuestOrder) {
            guestCustomerId = guestCustomers[Math.floor(Math.random() * guestCustomers.length)].id;
            customerType = 'GUEST';
        } else {
            customerId = customers[Math.floor(Math.random() * customers.length)].id;
        }

        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
        const selectedProducts = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const product = outlet.products[Math.floor(Math.random() * outlet.products.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const price = product.price;

            selectedProducts.push({
                productId: product.id,
                quantity: quantity,
                priceAtTimeOfOrder: price,
            });

            totalAmount += price * quantity;
        }

        const paymentStatuses = ['SETTLEMENT', 'PENDING', 'CAPTURE', 'DENY'];
        const queueStatuses = ['COMPLETED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'AWAITING_PAYMENT'];

        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        const queueStatus = queueStatuses[Math.floor(Math.random() * queueStatuses.length)];

        orders.push({
            id: `order-${i + 1}`,
            totalAmount: totalAmount,
            customerType: customerType,
            customerId: customerId,
            guestCustomerId: guestCustomerId,
            outletId: outlet.id,
            paymentStatus: paymentStatus,
            queueStatus: queueStatus,
            items: selectedProducts,
            bookingDate: outlet.products[0].type === 'SERVICE' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        });
    }

    return orders;
}

async function createSampleExpenses() {
    const expenses = [];
    const outlets = await db.outlet.findMany();

    const expenseTypes = [
        { description: 'Listrik bulanan', amount: 200000 },
        { description: 'Gaji karyawan', amount: 1500000 },
        { description: 'Belanja bahan baku', amount: 500000 },
        { description: 'Sewa tempat', amount: 800000 },
        { description: 'Maintenance peralatan', amount: 150000 },
        { description: 'Promosi dan marketing', amount: 100000 },
        { description: 'Transportasi', amount: 50000 },
        { description: 'Alat tulis kantor', amount: 25000 },
    ];

    for (const outlet of outlets) {
        // Create 5-10 random expenses per outlet
        const numExpenses = Math.floor(Math.random() * 6) + 5;

        for (let i = 0; i < numExpenses; i++) {
            const expense = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30)); // Within last 30 days

            expenses.push({
                id: `expense-${outlet.id}-${i + 1}`,
                outletId: outlet.id,
                description: expense.description,
                amount: expense.amount + (Math.random() * 100000 - 50000), // ±50k variation
                date: randomDate,
            });
        }
    }

    return expenses;
}

async function main() {
    console.log('🌱 Starting database seeding...');

    try {
        // Clear existing data (optional - uncomment if needed)
        // console.log('🧹 Clearing existing data...');
        // await db.orderItem.deleteMany({});
        // await db.transaction.deleteMany({});
        // await db.order.deleteMany({});
        // await db.bookingSlot.deleteMany({});
        // await db.expense.deleteMany({});
        // await db.membership.deleteMany({});
        // await db.product.deleteMany({});
        // await db.outlet.deleteMany({});
        // await db.withdrawal.deleteMany({});
        // await db.wallet.deleteMany({});
        // await db.business.deleteMany({});
        // await db.guestCustomer.deleteMany({});
        // await db.user.deleteMany({});

        // 1. Seed Users
        console.log('👤 Seeding users...');
        for (const user of userData) {
            const hashedPassword = (await hashing(user.password))!;

            await db.user.upsert({
                where: { email: user.email },
                update: {
                    name: user.name,
                    role: user.role as any,
                    isVerified: user.isVerified,
                    phone: user.phone,
                    avatar: user.avatar,
                },
                create: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    password: hashedPassword,
                    role: user.role as any,
                    isVerified: user.isVerified,
                    phone: user.phone,
                    avatar: user.avatar,
                },
            });
        }

        // 2. Seed Guest Customers
        console.log('👥 Seeding guest customers...');
        for (const guest of guestCustomerData) {
            await db.guestCustomer.upsert({
                where: { id: guest.id },
                update: {
                    name: guest.name,
                    email: guest.email,
                    phone: guest.phone,
                },
                create: {
                    id: guest.id,
                    name: guest.name,
                    email: guest.email,
                    phone: guest.phone,
                },
            });
        }

        // 3. Seed Businesses with Wallets
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

        // 4. Seed Outlets
        console.log('🏪 Seeding outlets...');
        for (const business of businessData) {
            const numOutlets = Math.floor(Math.random() * 3) + 2; // 2-4 outlets per business

            for (let i = 0; i < numOutlets; i++) {
                const outletId = `${business.id}-outlet-${i + 1}`;
                const outletName = i === 0 ? 'Cabang Pusat' : outletNames[i % outletNames.length];

                await db.outlet.upsert({
                    where: { id: outletId },
                    update: {
                        name: outletName,
                        address: `Jl. ${outletName} No. ${Math.floor(Math.random() * 100) + 1}, Kota ${business.name.includes('Salon') ? 'Surabaya' : business.name.includes('Bengkel') ? 'Bandung' : 'Jakarta'}`,
                        phone: `08${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
                    },
                    create: {
                        id: outletId,
                        name: outletName,
                        address: `Jl. ${outletName} No. ${Math.floor(Math.random() * 100) + 1}, Kota ${business.name.includes('Salon') ? 'Surabaya' : business.name.includes('Bengkel') ? 'Bandung' : 'Jakarta'}`,
                        phone: `08${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
                        businessId: business.id,
                    },
                });
            }
        }

        // 5. Seed Products
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
                        quantity: Math.floor(Math.random() * 100) + 10,
                        unit: 'Porsi',
                        image: product.image,
                        status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE', // 10% chance inactive
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
                        outletId: outlet.id,
                        image: product.image,
                        status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
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
                        image: service.image,
                        serviceDurationMinutes: service.duration,
                        status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
                    },
                    create: {
                        id: productId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        costPrice: service.costPrice,
                        type: 'SERVICE',
                        quantity: null,
                        unit: 'Layanan',
                        outletId: outlet.id,
                        image: service.image,
                        serviceDurationMinutes: service.duration,
                        status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
                    },
                });
            }
        }

        // Products for Bengkel (SERVICES)
        const business3Outlets = await db.outlet.findMany({
            where: { businessId: 'business-3' },
        });

        for (const outlet of business3Outlets) {
            for (let i = 0; i < mechanicServices.length; i++) {
                const service = mechanicServices[i];
                const productId = `${outlet.id}-service-${i + 1}`;

                await db.product.upsert({
                    where: { id: productId },
                    update: {
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        costPrice: service.costPrice,
                        unit: 'Layanan',
                        image: service.image,
                        serviceDurationMinutes: service.duration,
                        status: Math.random() > 0.05 ? 'ACTIVE' : 'INACTIVE',
                    },
                    create: {
                        id: productId,
                        name: service.name,
                        description: service.description,
                        price: service.price,
                        costPrice: service.costPrice,
                        type: 'SERVICE',
                        quantity: null,
                        unit: 'Layanan',
                        outletId: outlet.id,
                        image: service.image,
                        serviceDurationMinutes: service.duration,
                        status: Math.random() > 0.05 ? 'ACTIVE' : 'INACTIVE',
                    },
                });
            }
        }

        // 6. Seed Booking Slots for Services
        console.log('📅 Seeding booking slots for services...');
        const serviceProducts = await db.product.findMany({
            where: { type: 'SERVICE' },
        });

        for (const product of serviceProducts) {
            const slots = await createBookingSlots(product.id, product);

            for (const slot of slots) {
                await db.bookingSlot.upsert({
                    where: { id: slot.id },
                    update: {
                        status: slot.status as any,
                        date: slot.date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                    },
                    create: {
                        id: slot.id,
                        productId: slot.productId,
                        date: slot.date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        status: slot.status as any,
                    },
                });
            }
        }

        // 7. Seed Memberships
        console.log('🎫 Seeding memberships...');
        for (const membership of membershipData) {
            await db.membership.upsert({
                where: {
                    customerId_businessId: {
                        customerId: membership.customerId,
                        businessId: membership.businessId,
                    },
                },
                update: {
                    memberCode: membership.memberCode,
                    memberType: membership.memberType as any,
                    discountPercentage: membership.discountPercentage,
                    isActive: true,
                },
                create: {
                    customerId: membership.customerId,
                    businessId: membership.businessId,
                    memberCode: membership.memberCode,
                    memberType: membership.memberType as any,
                    discountPercentage: membership.discountPercentage,
                    isActive: true,
                },
            });
        }

        // 8. Seed Sample Orders
        console.log('🛒 Seeding sample orders...');
        const sampleOrders = await createSampleOrders();

        for (const order of sampleOrders) {
            const createdOrder = await db.order.upsert({
                where: { id: order.id },
                update: {
                    totalAmount: order.totalAmount,
                    customerType: order.customerType as any,
                    customerId: order.customerId,
                    guestCustomerId: order.guestCustomerId,
                    outletId: order.outletId,
                    paymentStatus: order.paymentStatus as any,
                    queueStatus: order.queueStatus as any,
                    bookingDate: order.bookingDate,
                },
                create: {
                    id: order.id,
                    totalAmount: order.totalAmount,
                    customerType: order.customerType as any,
                    customerId: order.customerId,
                    guestCustomerId: order.guestCustomerId,
                    outletId: order.outletId,
                    paymentStatus: order.paymentStatus as any,
                    queueStatus: order.queueStatus as any,
                    bookingDate: order.bookingDate,
                },
            });

            // Create order items
            for (const item of order.items) {
                await db.orderItem.create({
                    data: {
                        orderId: createdOrder.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtTimeOfOrder: item.priceAtTimeOfOrder,
                    },
                });
            }

            // Create transaction if payment is successful
            if (['SETTLEMENT', 'CAPTURE'].includes(order.paymentStatus)) {
                await db.transaction.create({
                    data: {
                        orderId: createdOrder.id,
                        amount: order.totalAmount,
                        paymentMethod: 'midtrans_qris',
                        status: 'SUCCESS',
                        externalId: `midtrans-${order.id}-${Date.now()}`,
                        fee: order.totalAmount * 0.007, // 0.7% fee
                        adminFee: 0,
                        feePaidBy: 'CUSTOMER',
                        paidAt: new Date(),
                    },
                });
            }
        }

        // 9. Seed Sample Expenses
        console.log('💰 Seeding sample expenses...');
        const sampleExpenses = await createSampleExpenses();

        for (const expense of sampleExpenses) {
            await db.expense.upsert({
                where: { id: expense.id },
                update: {
                    description: expense.description,
                    amount: expense.amount,
                    date: expense.date,
                    outletId: expense.outletId,
                },
                create: {
                    id: expense.id,
                    description: expense.description,
                    amount: expense.amount,
                    date: expense.date,
                    outletId: expense.outletId,
                },
            });
        }

        // 10. Seed Sample Withdrawals
        console.log('🏧 Seeding sample withdrawals...');
        const wallets = await db.wallet.findMany();

        for (const wallet of wallets) {
            const numWithdrawals = Math.floor(Math.random() * 3) + 1; // 1-3 withdrawals per wallet

            for (let i = 0; i < numWithdrawals; i++) {
                const withdrawalAmount = Math.floor(Math.random() * 500000) + 50000; // 50k - 550k
                const applicationFee = withdrawalAmount * 0.025; // 2.5% application fee
                const bankTransferFee = 2500; // Fixed bank transfer fee

                const statuses = ['COMPLETED', 'PENDING', 'REJECTED'];
                const status = statuses[Math.floor(Math.random() * statuses.length)] as any;

                await db.withdrawal.create({
                    data: {
                        walletId: wallet.id,
                        amount: withdrawalAmount,
                        applicationFee: applicationFee,
                        bankTransferFee: bankTransferFee,
                        status: status,
                        notes: status === 'REJECTED' ? 'Insufficient balance' : status === 'COMPLETED' ? 'Transfer successful' : 'Processing',
                    },
                });
            }
        }

        // 11. Update wallet balances based on transactions
        console.log('💳 Updating wallet balances...');
        const businesses = await db.business.findMany({
            include: {
                wallet: true,
                outlets: {
                    include: {
                        orders: {
                            include: {
                                transaction: true,
                            },
                        },
                    },
                },
            },
        });

        for (const business of businesses) {
            let totalRevenue = 0;

            for (const outlet of business.outlets) {
                for (const order of outlet.orders) {
                    if (order.transaction && order.transaction.status === 'SUCCESS') {
                        totalRevenue += order.transaction.amount - order.transaction.fee;
                    }
                }
            }

            // Update wallet balance
            await db.wallet.update({
                where: { id: business.wallet?.id },
                data: {
                    balance: Math.max(0, business.wallet?.balance! + totalRevenue),
                },
            });
        }

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📊 Seeding Summary:');
        console.log(`- Users: ${userData.length} (${userData.filter(u => u.role === 'CUSTOMER').length} customers, ${userData.filter(u => u.role === 'OWNER').length} owners)`);
        console.log(`- Guest Customers: ${guestCustomerData.length}`);
        console.log(`- Businesses: ${businessData.length} (each with wallet)`);
        console.log(`- Outlets: ${business1Outlets.length + business2Outlets.length + business3Outlets.length} total`);
        console.log(`- Products: ${(business1Outlets.length * foodProducts.length) + (business2Outlets.length * beautyServices.length) + (business3Outlets.length * mechanicServices.length)} total`);
        console.log(`- Booking Slots: ${serviceProducts.length * 30 * 8} total (30 days × 8 hours)`);
        console.log(`- Memberships: ${membershipData.length}`);
        console.log(`- Sample Orders: ${sampleOrders.length}`);
        console.log(`- Sample Expenses: ${sampleExpenses.length}`);
        console.log(`- Sample Withdrawals: ${wallets.length * 2} average`);

        // Display sample login credentials
        console.log('\n🔑 Sample Login Credentials:');
        console.log('\n👤 Customers:');
        userData.filter(u => u.role === 'CUSTOMER').forEach(user => {
            console.log(`   Email: ${user.email} | Password: ${user.password} | Verified: ${user.isVerified}`);
        });

        console.log('\n🏢 Business Owners:');
        userData.filter(u => u.role === 'OWNER').forEach(user => {
            console.log(`   Email: ${user.email} | Password: ${user.password} | Verified: ${user.isVerified}`);
        });

        console.log('\n🏪 Businesses Created:');
        businessData.forEach(business => {
            console.log(`   ${business.name} (${business.description})`);
        });

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