import { create } from "zustand";
import type { CartItem } from "@/features/cart";
import type { PaymentMethod } from "@/types/payment";

interface OutletSummary {
  outletId: string;
  outletName: string;
  subtotal: number;
  items: CartItem[];
}

interface CheckoutState {
  outlets: OutletSummary[];
  subtotal: number;
  tax: number;
  taxName: string | null;
  grandTotal: number;
  transactionFee: number;
  applicationFee: number;
  selectedPaymentMethod: PaymentMethod | null;

  setCheckoutData: (data: {
    outlets: OutletSummary[];
    subtotal: number;
    tax: number;
    taxName: string | null;
    grandTotal: number;
    transactionFee: number;
    applicationFee: number;
    selectedPaymentMethod: PaymentMethod;
  }) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  outlets: [],
  subtotal: 0,
  tax: 0,
  taxName: null,
  grandTotal: 0,
  transactionFee: 0,
  applicationFee: 0,
  selectedPaymentMethod: null,

  setCheckoutData: (data) => set(data),
  clearCheckout: () =>
    set({
      outlets: [],
      subtotal: 0,
      tax: 0,
      taxName: null,
      grandTotal: 0,
      transactionFee: 0,
      applicationFee: 0,
      selectedPaymentMethod: null,
    }),
}));
