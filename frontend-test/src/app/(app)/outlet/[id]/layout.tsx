import type { Metadata } from "next";
import { OutletDetails } from "@/types/outlet";
import api from "@/lib/api";

type Props = {
    params: Promise<{ id: string }>;
};

async function getOutlet(id: string): Promise<OutletDetails | null> {
    try {
        const { data } = await api.get(`/outlets/${id}`);
        return data.data;
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
                type: "website"
            },
            twitter: {
                card: "summary_large_image",
                title: "Outlet Tidak Ditemukan - Boss App",
                description: "Outlet yang Anda cari tidak ditemukan.",
            },
        };
    }

    return {
        title: `${outlet.name} - ${outlet.business?.name ?? "Boss App"}`,
        description: outlet.description || "Informasi outlet",
        openGraph: {
            title: `${outlet.name} - ${outlet.business?.name ?? "Boss App"}`,
            description: outlet.description || "Informasi outlet",
            images: outlet.image ? [outlet.image] : [],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: `${outlet.name} - ${outlet.business?.name ?? "Boss App"}`,
            description: outlet.description || "Informasi outlet",
            images: outlet.image ? [outlet.image] : [],
        },
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
