import { notFound } from "next/navigation";
import { isAxiosError } from "axios";

import { PaymentDetailClient } from "@/components/payment/PaymentDetailClient";
import { PaymentService } from "@/services/paymentService";

export const revalidate = 0;

type OrderPaymentPageProps = {
    params: Promise<{
        orderId: string;
    }>;
};

export default async function OrderPaymentPage({ params }: OrderPaymentPageProps) {
    const { orderId } = await params;

    if (!orderId) {
        notFound();
    }

    try {
        const payment = await PaymentService.getPaymentDetail(orderId);

        // Ensure only plain serializable data is passed to the Client Component
        const safePayment = JSON.parse(JSON.stringify(payment));

        return <PaymentDetailClient orderId={orderId} payment={safePayment} />;
    } catch (error) {
        console.error('Failed to load payment detail page:', error);
        if (isAxiosError(error)) {
            if (error.response?.status === 404) {
                notFound();
            }

            throw new Error(error.response?.data?.message ?? error.message);
        }

        // Always wrap in a plain Error to avoid leaking non-serializable objects (e.g. AxiosError config)
        throw new Error(error instanceof Error ? error.message : 'Gagal memuat detail pembayaran');
    }
}