import GlobalBannerContent from "@/components/admin/banners/Content"
import { Metadata } from "next"

export const metaData: Metadata = {
    title: 'Banners | BOSS',
    description: 'Atur banner'
}

export default function BannersPage() {
    return (<GlobalBannerContent />)
}