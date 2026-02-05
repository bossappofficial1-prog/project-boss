import SubscriptionPaymentContent from "@/components/features/owner/subscription/payment/PaymentContent"

type PaymentPageProps = {
    params: {
        invoiceId: string
    }
}

export default function PaymentPage({ params }: PaymentPageProps) {
    return (<SubscriptionPaymentContent invoiceId={params.invoiceId} />)
}