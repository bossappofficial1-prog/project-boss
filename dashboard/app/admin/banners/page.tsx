import GlobalBannerContent from "@/components/admin/banners/BannerContent"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Banners',
    description: 'Atur banner'
}

export default function BannersPage() {
    return (<GlobalBannerContent />)
}