import { CartItem } from '@/hooks/useCart';
import { OutletSummary, CheckoutData } from '@/types/checkout';
import { Outlet } from './outlets';
import { ManualPaymentResponse, PaymentMethod, PaymentMethodId } from '@/types';
import api from '@/lib/api';

type ManualPaymentStorageData = {
    response: ManualPaymentResponse;
    checkoutData: CheckoutData;
    selectedPaymentMethod: PaymentMethod;
    customerInfo: {
        name: string;
        phone: string;
    };
    createdAt: string;
};

const MANUAL_PAYMENT_STORAGE_KEY = 'manual-payment-info';

export class CheckoutService {
    /**
     * Transform cart items to checkout data format
     */
    static async prepareCheckoutData(cartItems: CartItem[]): Promise<CheckoutData> {
        // Validasi: Pastikan hanya ada satu outlet
        const uniqueOutlets = [...new Set(cartItems.map(item => item.outletId))];
        if (uniqueOutlets.length > 1) {
            throw new Error('Checkout hanya dapat dilakukan untuk satu outlet saja');
        }

        // Validasi: Pastikan hanya ada satu jenis produk
        const uniqueProductTypes = [...new Set(cartItems.map(item => item.type))];
        if (uniqueProductTypes.length > 1) {
            throw new Error('Tidak dapat checkout produk GOODS dan SERVICE secara bersamaan dalam satu outlet');
        }

        // Group items by outlet
        const outletGroups = cartItems.reduce((groups, item) => {
            const outletId = item.outletId;
            if (!groups[outletId]) {
                groups[outletId] = {
                    outletName: item.outletName,
                    items: [],
                    subtotal: 0,
                    outletId
                };
            }
            groups[outletId].items.push(item);
            groups[outletId].subtotal += item.price * item.quantity;
            return groups;
        }, {} as Record<string, { outletName: string; outletId: string; items: CartItem[]; subtotal: number }>);

        // Calculate fees per outlet
        const outletPromises = Object.values(outletGroups).map(async (group) => {
            const outlet = await Outlet.getDetail(group.outletId);

            const transactionFee = outlet.business.defaultTransactionFeeBearer === "CUSTOMER" ? (group.subtotal * 0.02) : 0;
            const applicationFee = group.subtotal * 0.03;

            return {
                outletName: group.outletName,
                outletId: group.outletId,
                subtotal: group.subtotal,
                transactionFee,
                applicationFee,
                items: group.items
            };
        });

        const outlets = await Promise.all(outletPromises);

        // Calculate totals
        const subtotal = outlets.reduce((total, outlet) => total + outlet.subtotal, 0);
        const totalTransactionFee = outlets.reduce((total, outlet) => total + outlet.transactionFee, 0);
        const applicationFee = outlets.reduce((total, outlet) => total + outlet.applicationFee, 0);
        const grandTotal = subtotal + totalTransactionFee + applicationFee;

        return {
            outlets,
            subtotal,
            totalTransactionFee,
            applicationFee,
            grandTotal
        };
    }

    /**
     * Get checkout data from localStorage (for page refresh)
     */
    static getCheckoutDataFromStorage(): CheckoutData | null {
        if (typeof window === 'undefined') return null;

        try {
            const stored = localStorage.getItem('checkout-data');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save checkout data to localStorage
     */
    static saveCheckoutDataToStorage(data: CheckoutData): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem('checkout-data', JSON.stringify(data));
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Clear checkout data from localStorage
     */
    static clearCheckoutDataFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem('checkout-data');
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Save payment data to localStorage
     */
    static savePaymentDataToStorage(data: any): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem('payment-data', JSON.stringify(data));
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Get payment data from localStorage
     */
    static getPaymentDataFromStorage(): any | null {
        if (typeof window === 'undefined') return null;

        try {
            const stored = localStorage.getItem('payment-data');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Clear payment data from localStorage
     */
    static clearPaymentDataFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem('payment-data');
        } catch {
            // Ignore storage errors
        }
    }

    static saveManualPaymentToStorage(data: ManualPaymentStorageData): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(MANUAL_PAYMENT_STORAGE_KEY, JSON.stringify(data));
        } catch {
            // Ignore storage errors
        }
    }

    static getManualPaymentFromStorage(): ManualPaymentStorageData | null {
        if (typeof window === 'undefined') return null;

        try {
            const stored = localStorage.getItem(MANUAL_PAYMENT_STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    static clearManualPaymentFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(MANUAL_PAYMENT_STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Process payment by sending payload to backend API
     */
    static async processPayment(payload: {
        outletId: string;
        customer_details: {
            name: string;
            phone: string;
        };
        item_details: Array<{
            productId: string;
            quantity: number;
        }>;
        payment_method: PaymentMethodId;
        selectedSlotId?: string;
    }): Promise<any> {
        try {
            // TODO: Replace with actual API endpoint
            const response = await api.addData('/orders/create-payment', payload);
            return response;
        } catch (error) {
            console.error('Payment processing failed:', error);
            throw error;
        }
    }
}
