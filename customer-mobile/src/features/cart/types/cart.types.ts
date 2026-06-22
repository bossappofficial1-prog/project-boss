import { BookingSlot } from "../../outlet";

export interface CartItem {
  id: string;
  outletId: string;
  outletName: string;
  slug: string;
  productId: string;
  name: string;
  price: number;
  taxPercentage?: number | null;
  taxName?: string | null;
  quantity: number;
  type: "GOODS" | "SERVICE" | "TICKET";
  image?: string | null;
  unit?: string;
  maxQuantity?: number;
  serviceDurationMinutes?: number;
  selectedSlot?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  slotDate?: string;
  staffId?: string;
  staffName?: string;
}

export interface SelectedSchedule {
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    status: BookingSlot["status"];
    date: string;
  };
  staff?: {
    id: string;
    name: string;
  };
}

export interface CartState {
  items: CartItem[];
  tableId: string | null;
  tableName: string | null;
  tableOutletId: string | null;
  setTableId: (
    tableId: string | null,
    tableName?: string | null,
    tableOutletId?: string | null,
  ) => void;
  addItem: (
    outletId: string,
    outletName: string,
    slug: string,
    product: {
      id: string;
      name: string;
      type: "GOODS" | "SERVICE" | "TICKET";
      image?: string | null;
      taxPercentage?: number | null;
      taxName?: string | null;
      price: number;
      unit?: string;
      maxQuantity?: number;
      serviceDurationMinutes?: number;
    },
    quantity?: number,
    selectedSchedule?: SelectedSchedule,
  ) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  clearOutletItems: (outletId: string) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getOutletItems: (outletId: string) => CartItem[];
  getItemById: (itemId: string) => CartItem | undefined;
  getServiceInCart: (
    productId: string,
    outletId: string,
  ) => CartItem | undefined;
  checkTimeConflict: (
    outletId: string,
    newSlot: { startTime: string; endTime: string; date: string },
  ) => CartItem | undefined;
}
