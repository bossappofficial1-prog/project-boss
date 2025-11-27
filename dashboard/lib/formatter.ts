import { OrderStatus } from "./apis/order";


export const formatStatusPesanan = (status: OrderStatus) => {
    let text: string;

    switch (status) {
        case "READY": text = "Pesanan Siap"; break;
        case "AWAITING_PAYMENT": text = "Menunggu Pembayaran"; break;
        case "CANCELLED": text = "Pesanan Dibatalkan"; break;
        case "COMPLETED": text = "Pesanan Selesai"; break;
        case "CONFIRMED": text = "Pesanan Dikonfirmasi"; break;
        case "PROCESSING": text = "Pesanan Diproses"; break;
        default: text = "Unkonwn"; break;
    }

    return text
}