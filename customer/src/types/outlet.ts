export type BookingSlot = {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "AVAILABLE" | "BOOKED" | "COMPLETED";
    productId: string;
    orderId: string | null;
    staffId: string | null;
};

export type Product = {
    id: string;
    name: string;
    description: string;
    costPrice: number;
    price: number;
    type: "GOODS" | "SERVICE";
    quantity: number | null;
    unit: string | null;
    status: "ACTIVE" | "INACTIVE";
    transactionFeeBearer: "CUSTOMER" | null;
    serviceDurationMinutes: number | null;
    outletId: string;
    image: string;
    images?: { url: string; alt?: string }[];
    bookingSlots: BookingSlot[];
};

export type OutletDetails = {
    id: string;
    name: string;
    type: "FNB" | "RETAIL" | "EVENT" | "SERVICE" | "CUSTOM";
    slug?: string;
    description?: string;
    address: string;
    phone: string;
    image: string | null;
    isOpen: boolean;
    latitude: number;
    longitude: number;
    distance?: string;
    createdAt: string;
    updatedAt: string;
    businessId: string;
    operatingHours: Array<any>
    business: {
        id: string;
        name: string;
    };
    openingHours?: Array<{
        day: string;
        open: string;
        close: string;
    }>;
    categories?: string[];
    _count?: {
        orders: number;
    };
};

export type ProductsResponse = {
    success: boolean;
    message: string;
    data: Product[];
    timestamp: string;
    path: string;
};
