export type BookingSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export type StaffRole = 'CASHIER' | 'ADMIN' | 'MANAGER';
export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type StaffPrivilegeType =
  | 'OUTLET_MANAGEMENT'
  | 'PRODUCT_MANAGEMENT'
  | 'STOCK_MANAGEMENT'
  | 'CUSTOMER_MANAGEMENT'
  | 'ORDER_MANAGEMENT'
  | 'SERVICE_MANAGEMENT'
  | 'FINANCE_REPORTS'
  | 'TRANSACTION_VIEW'
  | 'TRANSACTION_DELETE'
  | 'ANALYTICS'
  | 'TOOLS_CALCULATOR';

export interface StaffPrivilege {
    id: string;
    staffId: string;
    privilege: StaffPrivilegeType;
    createdAt: string;
}


export interface StaffMember {
    id: string;
    name: string;
    phone?: string | null;
    username?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    status: StaffStatus;
    role: StaffRole;
    outletId: string;
    createdAt: string;
    updatedAt: string;
    privileges?: StaffPrivilege[];
}


export interface CreateStaffPayload {
    name: string;
    phone?: string | null;
    username?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    role: StaffRole;
    status: StaffStatus;
    outletId: string;
    password?: string | null;
    pin?: string | null;
    privileges?: StaffPrivilegeType[];
}

export interface UpdateStaffPayload {
    name?: string;
    phone?: string | null;
    username?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    role?: StaffRole;
    status?: StaffStatus;
    password?: string | null;
    pin?: string | null;
    privileges?: StaffPrivilegeType[];
}


export interface StaffAvailability {
    id: string;
    name: string;
    phone?: string | null;
    username?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
    role: string;
    isAvailable: boolean;
    conflicts: Array<{
        slotId: string;
        startTime: string;
        endTime: string;
        status: BookingSlotStatus;
    }>;
}

export interface StaffAvailabilityResponse {
    staff: StaffAvailability[];
    window: {
        startTime: string;
        endTime: string;
    };
    slotId: string | null;
}
