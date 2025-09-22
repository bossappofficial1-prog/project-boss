import type { Metadata } from "next";
import axios from 'axios';
import { OutletDetails } from "@/types/outlet";

type Props = {
    params: Promise<{ id: string }>;
};

async function getOutlet(id: string): Promise<OutletDetails | null> {
    try {
        const res = await axios.get(`${process.env.SERVER_API_URL}/outlets/${id}`);
        return res.data?.data || null;
    } catch (error) {
        console.error(`Error fetching outlet ${id}:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const outlet = await getOutlet(id);

    // Default metadata when outlet is not found
    if (!outlet) {
        return {
            title: "Outlet Tidak Ditemukan - Boss App",
            description: "Outlet yang Anda cari tidak ditemukan.",
            openGraph: {
                title: "Outlet Tidak Ditemukan - Boss App",
                description: "Outlet yang Anda cari tidak ditemukan.",
                type: "website",
                siteName: "Boss App",
                locale: "id_ID",
            },
            twitter: {
                card: "summary_large_image",
                title: "Outlet Tidak Ditemukan - Boss App",
                description: "Outlet yang Anda cari tidak ditemukan.",
            },
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    return {
        title: `${outlet.name} | ${outlet.business?.name ?? "Boss App"}`,
        description: outlet.description || `Kunjungi ${outlet.name} untuk layanan terbaik. ${outlet.address ? `Berlokasi di ${outlet.address}` : ''}`,
        keywords: [
            outlet.name,
            outlet.business?.name || "Boss App",
            "layanan",
            "booking",
            "reservasi",
            outlet.address ? outlet.address.split(',')[0] : "",
        ].filter(Boolean),
        authors: [{ name: outlet.business?.name || "Boss App" }],
        openGraph: {
            title: `${outlet.name} | ${outlet.business?.name ?? "Boss App"}`,
            description: `Kunjungi ${outlet.name} untuk layanan terbaik. ${outlet.address ? `Berlokasi di ${outlet.address}` : ''}`,
            images: outlet.image ? [
                {
                    url: outlet.image,
                    width: 1200,
                    height: 630,
                    alt: `${outlet.name} - ${outlet.business?.name || "Boss App"}`,
                }
            ] : [],
            type: "website",
            siteName: outlet.business?.name || "Boss App",
            locale: "id_ID",
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bossapp.id'}/outlet/${id}`,
        },
        twitter: {
            card: "summary_large_image",
            title: `${outlet.name} | ${outlet.business?.name ?? "Boss App"}`,
            description: outlet.description || `Kunjungi ${outlet.name} untuk layanan terbaik.`,
            images: outlet.image ? [outlet.image] : [],
            site: "@bossapp",
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bossapp.id'}/outlet/${id}`,
        },
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
