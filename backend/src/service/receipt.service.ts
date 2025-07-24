import PDFDocument from 'pdfkit';
import { Order, OrderItem, Product } from '@prisma/client';

type OrderWithDetails = Order & {
    items: (OrderItem & { product: Product })[];
    guestCustomer: { name: string };
};

export class ReceiptService {
    static generateReceipt(order: OrderWithDetails): Promise<Buffer> {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ size: 'A7', margin: 20 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });

            // --- Receipt Content ---
            doc.fontSize(12).text('Struk Pembayaran', { align: 'center' });
            doc.moveDown();

            doc.fontSize(8).text(`ID Pesanan: ${order.id}`);
            doc.text(`Customer: ${order.guestCustomer.name}`);
            doc.text(`Tanggal: ${new Date(order.createdAt).toLocaleString()}`);
            doc.moveDown();

            doc.text('--- Item Pesanan ---');
            order.items.forEach(item => {
                doc.text(`${item.product.name} (x${item.quantity}) - Rp${item.priceAtTimeOfOrder * item.quantity}`);
            });
            doc.moveDown();

            doc.fontSize(10).text(`Total: Rp${order.totalAmount}`, { align: 'right' });
            // --- End of Content ---

            doc.end();
        });
    }
}