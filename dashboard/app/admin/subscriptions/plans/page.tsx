import SubscriptionPlansContent from "@/components/admin/subcriptions/plans/SubcriptionPlansContent"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Manajemen Paket Harga'
}

export default function subscriptionPage() {
    return (<SubscriptionPlansContent />)
}