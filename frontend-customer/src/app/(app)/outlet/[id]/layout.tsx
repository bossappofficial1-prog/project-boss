import type { Metadata } from "next";
import axios from 'axios';
import { OutletDetails } from "@/types/outlet";
import { resolveCustomerImageUrl } from "@/lib/url";

type Params = Promise<{ id: string }>;

async function getOutlet(id: string): Promise<OutletDetails | null> {
    try {
        const res = await axios.get(`${process.env.SERVER_API_URL}/outlets/${id}`);
        return res.data?.data || null;
    } catch (error) {
        console.error(`Error fetching outlet ${id}:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const resolvedParams = await params;
    const id = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
    if (!id) {
        return {
            title: "Outlet Tidak Ditemukan - Boss App",
            description: "Outlet yang Anda cari tidak ditemukan.",
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://bossapp.id";
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

    const safeImage = resolveCustomerImageUrl(outlet.image);
    const absoluteImage = safeImage
        ? (safeImage.startsWith("http") ? safeImage : `${baseUrl}${safeImage}`)
        : undefined;

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
            images: absoluteImage ? [
                {
                    url: absoluteImage,
                    width: 1200,
                    height: 630,
                    alt: `${outlet.name} - ${outlet.business?.name || "Boss App"}`,
                }
            ] : undefined,
            type: "website",
            siteName: outlet.business?.name || "Boss App",
            locale: "id_ID",
            url: `${baseUrl}/outlet/${id}`,
        },
        twitter: {
            card: "summary_large_image",
            title: `${outlet.name} | ${outlet.business?.name ?? "Boss App"}`,
            description: outlet.description || `Kunjungi ${outlet.name} untuk layanan terbaik.`,
            images: absoluteImage ? [absoluteImage] : undefined,
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
            canonical: `${baseUrl}/outlet/${id}`,
        },
    };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Params }) {
    const resolvedParams = await params;
    const id = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
    let structuredData: string | null = null;

    if (id) {
        const outlet = await getOutlet(id);
        if (outlet) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://bossapp.id";
            const safeImage = resolveCustomerImageUrl(outlet.image);
            const absoluteImage = safeImage
                ? (safeImage.startsWith("http") ? safeImage : `${baseUrl}${safeImage}`)
                : undefined;

            structuredData = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: outlet.name,
                description: outlet.description || undefined,
                image: absoluteImage,
                url: `${baseUrl}/outlet/${id}`,
                telephone: outlet.phone || undefined,
                address: outlet.address ? {
                    '@type': 'PostalAddress',
                    streetAddress: outlet.address,
                } : undefined,
            });
        }
    }

    return (
        <>
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: structuredData }}
                />
            )}
            {children}
        </>
    );
}
