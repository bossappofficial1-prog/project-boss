import { EscPosEncoder } from "../../utils/escpos-encoder";

export const generateReceiptEscPos = (data: any): Buffer => {
    const encoder = new EscPosEncoder();
    
    // Width defaults to 32 characters for 58mm printer
    const width = data.printWidth === 80 ? 48 : 32;

    encoder.initialize()
        .alignCenter()
        .bold(true)
        .text(data.storeName || "TOKO KASIR")
        .newline()
        .bold(false)
        .text(data.address || "")
        .newline()
        .text(data.phone || "")
        .newline()
        .separator('-', width)
        
        .alignLeft()
        .text(`No: ${data.orderNo || "-"}`)
        .newline()
        .text(`Tgl: ${data.date} ${data.time}`)
        .newline()
        .text(`Kasir: ${data.cashier}`)
        .newline()
        .text(`Pelanggan: ${data.customerName}`)
        .newline()
        .separator('-', width);

    // Items
    if (data.items && data.items.length > 0) {
        data.items.forEach((item: any) => {
            encoder.text(item.name.substring(0, width)).newline();
            encoder.table([
                { text: `${item.qty} x ${new Intl.NumberFormat('id-ID').format(item.price)}`, width: Math.floor(width * 0.6), align: 'LEFT' },
                { text: new Intl.NumberFormat('id-ID').format(item.subtotal), width: width - Math.floor(width * 0.6), align: 'RIGHT' }
            ]);
        });
    }

    encoder.separator('-', width);

    // Total
    encoder.table([
        { text: 'Subtotal', width: Math.floor(width * 0.6), align: 'LEFT' },
        { text: new Intl.NumberFormat('id-ID').format(data.subTotal), width: width - Math.floor(width * 0.6), align: 'RIGHT' }
    ]);
    
    if (data.discountAmount > 0) {
        encoder.table([
            { text: 'Diskon', width: Math.floor(width * 0.6), align: 'LEFT' },
            { text: `-${new Intl.NumberFormat('id-ID').format(data.discountAmount)}`, width: width - Math.floor(width * 0.6), align: 'RIGHT' }
        ]);
    }

    encoder.bold(true)
        .table([
            { text: 'TOTAL', width: Math.floor(width * 0.6), align: 'LEFT' },
            { text: new Intl.NumberFormat('id-ID').format(data.total), width: width - Math.floor(width * 0.6), align: 'RIGHT' }
        ])
        .bold(false)
        .newline();

    encoder.alignCenter()
        .text("Terima Kasih")
        .newline()
        .text("Selamat Datang Kembali")
        .newline()
        .feed(3)
        .cut();

    return encoder.encode();
};
