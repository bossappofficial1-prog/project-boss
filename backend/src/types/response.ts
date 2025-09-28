export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    timestamp: string;
    path: string;
}


export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage?: boolean;
        hasPrevPage?: boolean;
    };
}

export type OrderWithDetails = import('@prisma/client').Order & {
    items: (import('@prisma/client').OrderItem & {
        product: import('@prisma/client').Product;
    })[];
    guestCustomer: import('@prisma/client').GuestCustomer;
    outlet: import('@prisma/client').Outlet;
};