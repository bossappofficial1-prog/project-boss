export const generateReceiptHtml = (data: any) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        body { 
            width: 100%; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 5mm; /* Memberi sedikit ruang aman di pinggir */
            color: #000;
            box-sizing: border-box;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        .store-name { font-size: 16px; font-weight: bold; margin: 5px 0; }
        .meta-grid { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
        .item-row { margin-bottom: 8px; }
        .item-detail { display: flex; justify-content: space-between; }
        .total-section { margin-top: 10px; }
        .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .highlight-box { 
            /* Border dihapus sesuai permintaan */
            padding: 2px 0; 
            font-size: 10px; 
        }
        .footer { font-size: 10px; margin-top: 15px; }
        /* Memastikan tidak ada pemotongan halaman di tengah elemen */
        .item-row, .total-row { page-break-inside: avoid; }
    </style>
</head>
<body>
    <div class="header text-center">
        ${data.showLogo ? `<img src="${data.photoString}" style="width: 50px;"/>` : ``}
        <div class="store-name">${data.storeName}</div>
        <div class="address">${data.address}</div>
        <div>No. Telp ${data.phone}</div>
        <div style="font-size: 10px;">${data.transactionId}</div>
    </div>

    <div class="divider"></div>

    <div class="meta-grid">
        <div style="flex: 1;">
            ${data.date} ${data.time}<br>
            No.${data.orderNo}
        </div>
        <div class="text-right" style="flex: 1;">
            ${data.cashier} / ${data.customerName}<br>
            <span class="highlight-box">${data.shippingAddress}</span>
        </div>
    </div>

    <div class="divider"></div>

    <div class="items">
        ${data.items.map((item: any, index: number) => `
            <div class="item-row">
                <div><strong>${index + 1}. ${item.name}</strong></div>
                <div class="item-detail">
                    <span>${item.qty} ${item.unit} x ${item.price.toLocaleString('id-ID')}</span>
                    <span>${item.subtotal.toLocaleString('id-ID')}</span>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="divider"></div>

    <div class="total-section">
        <div class="total-row">
            <span>Total QTY : ${data.totalQty}</span>
        </div>
        <div class="total-row">
            <span>Sub Total</span>
            <span>Rp ${data.subTotal.toLocaleString('id-ID')}</span>
        </div>
        ${data.discountAmount ? `<div class="total-row" style="color: #666;">
            <span>Potongan Poin</span>
            <span>-Rp ${data.discountAmount.toLocaleString('id-ID')}</span>
        </div>` : ''}
        <div class="total-row" style="font-weight: bold; font-size: 14px;">
            <span>Total</span>
            <span>Rp ${data.total.toLocaleString('id-ID')}</span>
        </div>
    </div>

    <div class="footer text-center">
        <p>Terimakasih Telah Berbelanja</p>
        <p style="font-size: 8px;">bossapp.id</p>
    </div>
</body>
</html>
`;