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

        return <PaymentDetailClient orderId={orderId} payment={payment} />;
    } catch (error) {
        console.error('Failed to load payment detail page:', error);
        if (isAxiosError(error)) {
            if (error.response?.status === 404) {
                notFound();
            }

            throw new Error(error.response?.data?.message ?? error.message);
        }

        throw error;
    }
}