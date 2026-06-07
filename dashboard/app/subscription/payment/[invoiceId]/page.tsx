import SubscriptionPaymentContent from "@/features/owner/subscription/payment/payment-content"

type PaymentPageProps = {
    params: Promise<{
        invoiceId: string
    }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
    const { invoiceId } = await params
    return (<SubscriptionPaymentContent invoiceId={invoiceId} />)
}