import { PdfBaseService } from './pdf-base.service';

export interface TransactionReportData {
    docNumber: string;
    businessName: string;
    businessId: string;
    period: string;
    totalRevenue: number;
    totalTransactions: number;
    pendingCount: number;
    transactions: Array<{
        id: string;
        date: string;
        outletName: string;
        amount: number;
        status: string;
    }>;
    generatedAt: string;
}

export const generateTransactionReportPDF = async (data: TransactionReportData): Promise<Buffer> => {
    return PdfBaseService.generate({
        templateName: 'transaction-report.hbs',
        data,
        landscape: true,
        format: 'A4',
        headerFooter: {
            headerLeft: data.docNumber,
            headerRight: `${data.businessName} — ${data.period}`,
            footerLeft: '<strong>DISCLAIMER:</strong> E-statement ini digenerate otomatis oleh sistem Business One Stop System. Sah tanpa tanda tangan basah.',
            showPageNumber: true,
        },
    });
};

export interface TicketPrintData {
    id: string;
    code: string;
    productName: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    customerName: string;
    outletName: string;
    codeFormat?: string;
    primaryColor?: string;
    layoutType?: string;
    isBarcode?: boolean;
    codeImageUrl?: string;
}

export const generateTicketsPDF = async (tickets: TicketPrintData[]): Promise<Buffer> => {
    return PdfBaseService.generate({
        templateName: 'ticket.hbs',
        data: { tickets },
        landscape: false,
        format: 'A4',
    });
};

export interface OrderServiceData {
    OwnerName: string;
    OutletName: string;
    BookingDate: string;
    BookingTime: string;
    OrderId: string;
    ServiceName: string;
    CustomerName: string;
    CustomerPhone: string;
    TotalAmount: number | string;
    PaymentStatus: string;
    PaymentMethod: string;
    StaffName: string;
}

export const generateOrderServicePDF = async (data: OrderServiceData): Promise<Buffer> => {
    return PdfBaseService.generate({
        templateName: 'order-service.hbs',
        data,
        landscape: false,
        format: 'A4',
    });
};