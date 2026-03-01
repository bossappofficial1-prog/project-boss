import SubscriptionPaymentContent from "@/components/features/owner/subscription/payment/PaymentContent"

type PaymentPageProps = {
    params: Promise<{
        invoiceId: string
    }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
    const { invoiceId } = await params
    return (<SubscriptionPaymentContent invoiceId={invoiceId} />)
}