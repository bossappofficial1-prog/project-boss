export * from "./outlet"

export interface OutletType {
    id: string
    name: string
    address: string
    phone: string
    createdAt: string
    image: string
    updatedAt: string
    latitude: number
    longitude: number
    isOpen: boolean
    businessId: string
    operatingHours: OperatingHourType[]
    business: Pick<BusinessType, "id" | "name" | "defaultTransactionFeeBearer">
}

export interface BusinessType {
    id: string
    name: string
    description: string
    createdAt: string
    updatedAt: string
    bankName: string
    bankAccount: string
    accountHolder: string
    ownerId: string
    defaultTransactionFeeBearer: string
}

export interface OperatingHourType {
    id: string
    dayOfWeek: number
    openTime: string
    closeTime: string
    isOpen: boolean
}

export interface ProductType {
    id: string
    name: string
    description: any
    costPrice: number
    price: number
    type: "GOODS" | "SERVICE"
    quantity: number
    unit: string
    status: "ACTIVE" | "INACTIVE"
    transactionFeeBearer: any
    serviceDurationMinutes: any
    outletId: string
    image: string
    createdAt: string
    updatedAt: string
    defaultTransactionFeeBearer: string
}

export interface NearbyOutletsParams {
    latitude?: number;
    longitude?: number;
    radius?: number;
    limit?: number;
    take?: number;
    skip?: number;
    search?: string;
}

export interface BookingSlotType {
    id: string
    date: string
    startTime: string
    endTime: string
    status: BookingSlotStatus
    productId: string
    orderId: string
    staffId: string
    createdAt: string
    updatedAt: string
}

export type BookingSlotStatus =
    "AVAILABLE" |
    "BOOKED" |
    "BLOCKED";

export interface PaymentData {
    outlet: {
        name: string
        id: string
    }
    items: Array<{
        id: string
        name: string
        price: number
        quantity: number
    }>
    subtotal: number
    applicationFee: number
    total: number
    paymentMethod: {
        type: string
        name: string
        category: string
    }
    customerInfo: {
        name: string
        phone: string
    }
    orderId: string
    pendingSince?: string
    bankReference?: string
    estimatedProcessing?: string
    cancelledAt?: string
    cancelReason?: string
    failureReason?: string
    timestamp?: string
    expiredAt?: string
    paymentStarted?: string
    timeLimit?: number
}