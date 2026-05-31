import type { Metadata } from "next";
import { OutletDetails } from "@/types/outlet";
import { resolveCustomerImageUrl } from "@/lib/url";
import { serverFetch } from "@/lib/server-fetch";

type Params = Promise<{ slug: string }>;

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://customer.bossapp.id";
const FALLBACK_IMAGE = `${BASE_URL}/assets/logo/og-image.png`;
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

async function getOutlet(slug: string): Promise<OutletDetails | null> {
  return serverFetch<OutletDetails>(`/outlets/slug/${slug}`, {
    revalidate: 60,
    tags: [`outlet-${slug}`],
  });
}

function parseTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildOpeningHours(operatingHours: OutletDetails["operatingHours"]) {
  if (!operatingHours?.length) return undefined;

  const specs = [];

  for (const hour of operatingHours) {
    if (!hour.isOpen) continue;

    const dayName = DAYS[hour.dayOfWeek];
    const opens = parseTime(hour.openTime);
    const closes = parseTime(hour.closeTime);

    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${dayName}`,
      opens,
      closes,
    });

    if (hour.breakStart && hour.breakEnd) {
      const breakStarts = parseTime(hour.breakStart);
      const breakEnds = parseTime(hour.breakEnd);

      specs.pop();
      specs.push(
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${dayName}`,
          opens,
          closes: breakStarts,
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${dayName}`,
          opens: breakEnds,
          closes,
        },
      );
    }
  }

  return specs.length > 0 ? specs : undefined;
}

function resolveImage(outlet: OutletDetails): string {
  const safe = resolveCustomerImageUrl(outlet.image);
  if (!safe) return FALLBACK_IMAGE;
  return safe.startsWith("http") ? safe : `${BASE_URL}${safe}`;
}

function buildDescription(outlet: OutletDetails): string {
  const parts: string[] = [];
  if (outlet.description) {
    parts.push(outlet.description);
  } else {
    const category = outlet.type ?? "bisnis";
    parts.push(`${outlet.name} adalah ${category} yang terdaftar di BOSS.`);
  }
  if (outlet.address) parts.push(`Berlokasi di ${outlet.address}.`);
  parts.push("Pesan dan bayar langsung lewat BOSS.");
  return parts.join(" ");
}

const notFoundMetadata: Metadata = {
  title: "Outlet Tidak Ditemukan | BOSS",
  description: "Outlet yang kamu cari tidak ditemukan atau sudah tidak aktif.",
  openGraph: {
    title: "Outlet Tidak Ditemukan | BOSS",
    description:
      "Outlet yang kamu cari tidak ditemukan atau sudah tidak aktif.",
    type: "website",
    siteName: "BOSS",
    locale: "id_ID",
    images: [{ url: FALLBACK_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outlet Tidak Ditemukan | BOSS",
    description:
      "Outlet yang kamu cari tidak ditemukan atau sudah tidak aktif.",
    images: [FALLBACK_IMAGE],
  },
  robots: { index: false, follow: false },
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return notFoundMetadata;

  const outlet = await getOutlet(slug);
  if (!outlet) return notFoundMetadata;

  const image = resolveImage(outlet);
  const description = buildDescription(outlet);
  const businessName = outlet.business?.name ?? "BOSS";
  const canonicalUrl = `${BASE_URL}/outlet/${slug}`;

  // Keywords dinamis berdasarkan data outlet
  const keywords = [
    outlet.name,
    businessName,
    outlet.type,
    outlet.address?.split(",")[0],
    "pesan online",
    "bayar qris",
    "boss app",
  ].filter(Boolean) as string[];

  return {
    title: `${outlet.name} – ${businessName} | BOSS`,
    description,
    keywords,
    authors: [{ name: businessName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${outlet.name} – ${businessName}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${outlet.name} – ${businessName}`,
        },
      ],
      type: "website",
      siteName: "BOSS",
      locale: "id_ID",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${outlet.name} – ${businessName}`,
      description,
      images: [image],
      site: "@bossappid",
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
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { slug } = await params;
  if (!slug) return <>{children}</>;

  const outlet = await getOutlet(slug);
  if (!outlet) return <>{children}</>;

  const image = resolveImage(outlet);
  const canonicalUrl = `${BASE_URL}/outlet/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: outlet.name,
    description: outlet.description || undefined,
    image,
    url: canonicalUrl,
    telephone: outlet.phone || undefined,
    sameAs: outlet.instagramUrl ? [outlet.instagramUrl] : undefined,
    address: outlet.address
      ? {
          "@type": "PostalAddress",
          streetAddress: outlet.address,
          addressCountry: "ID",
        }
      : undefined,
    geo:
      outlet.latitude && outlet.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: outlet.latitude,
            longitude: outlet.longitude,
          }
        : undefined,
    openingHoursSpecification: buildOpeningHours(outlet.operatingHours),
    hasMap:
      outlet.latitude && outlet.longitude
        ? `https://www.google.com/maps?q=${outlet.latitude},${outlet.longitude}`
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
