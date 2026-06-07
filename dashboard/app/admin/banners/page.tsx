import GlobalBannerContent from "@/features/admin/banners/banner-content"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Banners',
    description: 'Atur banner'
}

export default function BannersPage() {
    return (<GlobalBannerContent />)
}