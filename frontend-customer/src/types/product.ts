export interface Product {
    id: string
    name: string
    status: 'ACTIVE' | 'INACTIVE'
    description?: string
    image: string
    type: 'GOODS' | 'SERVICE'
    createdAt: string
    updatedAt: string
    goods?: Goods
    service?: Service
}

export interface Goods {
    id: string
    productId: string
    currentStock: number
    minStock: number | null
    unit: string
    averageHpp: number
    sellingPrice: number
    createdAt: string
    updatedAt: string
}

export interface Service {
    id: string
    productId: string
    durationMinutes: number
    sellingPrice: number
    providerName: string
    providerPhone: string
    providerEmail: string
    commissionType: 'PRECENTAGE' | 'FIXED'
    commissionValue: number
    maxParallel: number
    createdAt: string
    updatedAt: string
}
