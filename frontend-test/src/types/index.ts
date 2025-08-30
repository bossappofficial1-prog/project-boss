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

export interface PaymentTimer {
    hours: number;
    minutes: number;
    seconds: number;
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

export type PaymentMethodId = "qris" | "bca-va" | "bni-va" | "bri-va" | "mandiri-va" | "permata-va"
export type PaymentMethodType = "qris" | "va"
export interface PaymentMethod {
    id: PaymentMethodId
    name: string
    type: PaymentMethodType
    description: string
    image_url: string
}

export interface PaymentResponse {
    status_code: string
    status_message: string
    transaction_id: string
    order_id: string
    merchant_id: string
    gross_amount: string
    currency: string
    payment_type: string
    transaction_time: string
    transaction_status: MidtransTransactionStatus
    fraud_status: string
    actions?: Action[]
    acquirer?: string
    qr_string?: string
    expiry_time: string
    va_numbers?: VaNumber[]
    transaction_type?: string //'off-us'
}

export type MidtransTransactionStatus =
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "failure";


export interface CustomerInfo {
    name: string,
    phone: string
}

export interface Action {
    name: string
    method: string
    url: string
}

export interface VaNumber {
    bank: string
    va_number: string
}