// Checkout service untuk mempersiapkan data dari cart
import { CartItem } from '@/hooks/useCart';
import { OutletSummary, CheckoutData } from '@/types/checkout';

export class CheckoutService {
    /**
     * Transform cart items to checkout data format
     */
    static prepareCheckoutData(cartItems: CartItem[]): CheckoutData {
        // Group items by outlet
        const outletGroups = cartItems.reduce((groups, item) => {
            const outletId = item.outletId;
            if (!groups[outletId]) {
                groups[outletId] = {
                    outletName: item.outletName,
                    items: [],
                    subtotal: 0
                };
            }
            groups[outletId].items.push(item);
            groups[outletId].subtotal += item.price * item.quantity;
            return groups;
        }, {} as Record<string, { outletName: string; items: CartItem[]; subtotal: number }>);

        // Calculate fees per outlet
        const outlets: OutletSummary[] = Object.values(outletGroups).map(group => {
            // Transaction fee calculation:
            // - Free for subtotal >= 100,000 (Rp 100k)
            // - 2,500 for subtotal < 100,000
            const transactionFee = group.subtotal >= 100000 ? 0 : 2500;

            // Application fee calculation:
            // - 1% of subtotal, minimum 1000, maximum 5000
            const applicationFeeRate = 0.01; // 1%
            const minApplicationFee = 1000;
            const maxApplicationFee = 5000;
            const applicationFee = Math.min(
                Math.max(group.subtotal * applicationFeeRate, minApplicationFee),
                maxApplicationFee
            );

            return {
                outletName: group.outletName,
                subtotal: group.subtotal,
                transactionFee,
                applicationFee
            };
        });

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
}
