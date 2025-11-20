import type { Product as BackendProduct } from '@/lib/apis/order';

export type PaymentMethod = 'cash' | 'qris' | 'online';

export type POSCustomerMode = 'identified' | 'walkin';

export interface POSProduct extends BackendProduct {
    description?: string;
    quantity?: number | null;
    image?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
    serviceDurationMinutes?: number | null;
    type: 'GOODS' | 'SERVICE';
}

export interface POSCartLine {
    product: POSProduct;
    quantity: number;
    bookingSlotId?: string;
    bookingStart?: string;
    bookingEnd?: string;
    staffId?: string;
    staffName?: string;
}
