import type { Metadata } from "next";
import { OutletDetails } from "@/types/outlet";
import { resolveCustomerImageUrl } from "@/lib/url";
import { serverFetch } from "@/lib/server-fetch";

type Params = Promise<{ slug: string }>;

async function getOutlet(slug: string): Promise<OutletDetails | null> {
    return serverFetch<OutletDetails>(`/outlets/slug/${slug}`, {
        revalidate: 60,
        tags: [`outlet-${slug}`],
    });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";
    if (!slug) {
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
    const outlet = await getOutlet(slug);

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
        title: `${outlet.name} - ${outlet.business?.name ?? "Boss App"}`,
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
            url: `${baseUrl}/outlet/${slug}`,
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
            canonical: `${baseUrl}/outlet/${slug}`,
        },
    };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Params }) {
    const resolvedParams = await params;
    const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";
    let structuredData: string | null = null;

    if (slug) {
        const outlet = await getOutlet(slug);
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
                url: `${baseUrl}/outlet/${slug}`,
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
