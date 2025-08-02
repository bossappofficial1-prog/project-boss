export interface Business {
  name: string
  defaultTransactionFeeBearer: string
}

export interface Outlet {
  id: string
  name: string
  address: string
  phone: string
  image: string
  isOpen: boolean
  business: Business
  operatingHours: any[]
}

export interface BookingSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  productId: string
  orderId: string | null
  staffId: string | null
}

export interface Product {
  id: string
  name: string
  description: string
  costPrice: number
  price: number
  type: 'GOODS' | 'SERVICE'
  quantity: number | null
  unit: string | null
  status: string
  image: string
  serviceDurationMinutes: number | null
  bookingSlots: BookingSlot[]
}
