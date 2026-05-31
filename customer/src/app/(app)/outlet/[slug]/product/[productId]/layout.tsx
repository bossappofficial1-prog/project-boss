import type { Metadata } from "next";
import { ProductType, OutletType } from "@/types";
import { resolveCustomerImageUrl } from "@/lib/url";
import { serverFetch } from "@/lib/server-fetch";

type Props = {
  params: Promise<{ slug: string; productId: string }>;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://customer.bossapp.id";
const FALLBACK_IMAGE = `${BASE_URL}/assets/logo/og-image.png`;

function resolveImage(product?: ProductType | null): string {
  if (!product?.image) return FALLBACK_IMAGE;
  const safe = resolveCustomerImageUrl(product.image);
  return safe.startsWith("http") ? safe : `${BASE_URL}${safe}`;
}

function resolveImages(product?: ProductType | null): string[] {
  const primary = resolveImage(product);
  const images: string[] = [primary];

  if (!product?.media?.length) return images;

  for (const item of product.media) {
    if (item.type !== "IMAGE") continue;
    const safe = resolveCustomerImageUrl(item.url);
    const absolute = safe.startsWith("http") ? safe : `${BASE_URL}${safe}`;
    images.push(absolute);
  }

  return Array.from(new Set(images));
}

function buildDescription(
  product?: ProductType | null,
  outlet?: OutletType | null,
): string {
  if (!product) {
    return "Produk yang Anda cari tidak ditemukan atau sudah tidak tersedia.";
  }
  if (product.description) return product.description;
  const outletName = outlet?.name ? ` di ${outlet.name}` : "";
  return `Detail produk ${product.name}${outletName} di aplikasi BOSS.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;

  const [product, outlet] = await Promise.all([
    serverFetch<ProductType>(`/products/${productId}`, {
      revalidate: 30,
      tags: [`product-${productId}`],
    }),
    serverFetch<OutletType>(`/outlets/slug/${slug}`, {
      revalidate: 60,
      tags: [`outlet-${slug}`],
    }),
  ]);

  const canonicalUrl = `${BASE_URL}/outlet/${slug}/product/${productId}`;
  const description = buildDescription(product, outlet);
  const image = resolveImage(product);
  const outletName = outlet?.name ?? "BOSS";

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan | BOSS",
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: "Produk Tidak Ditemukan | BOSS",
        description,
        images: [{ url: image, width: 1200, height: 630 }],
        type: "website",
        siteName: "BOSS",
        locale: "id_ID",
        url: canonicalUrl,
      },
      twitter: {
        card: "summary_large_image",
        title: "Produk Tidak Ditemukan | BOSS",
        description,
        images: [image],
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const keywords = [
    product.name,
    outletName,
    "menu",
    "pesan online",
    "bayar qris",
    "boss app",
  ].filter(Boolean) as string[];

  return {
    title: `${product.name} | ${outletName}`,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} | ${outletName}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${product.name} | ${outletName}`,
        },
      ],
      type: "website",
      siteName: "BOSS",
      locale: "id_ID",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${outletName}`,
      description,
      images: [image],
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

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Props["params"];
}) {
  const { slug, productId } = await params;

  const [product, outlet] = await Promise.all([
    serverFetch<ProductType>(`/products/${productId}`, {
      revalidate: 30,
      tags: [`product-${productId}`],
    }),
    serverFetch<OutletType>(`/outlets/slug/${slug}`, {
      revalidate: 60,
      tags: [`outlet-${slug}`],
    }),
  ]);

  if (!product) return children;

  const canonicalUrl = `${BASE_URL}/outlet/${slug}/product/${productId}`;
  const images = resolveImages(product);
  const description = buildDescription(product, outlet);
  const price =
    product.goods?.sellingPrice ??
    product.service?.sellingPrice ??
    product.ticket?.sellingPrice;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: images,
    url: canonicalUrl,
    sku: product.id,
    category: product.type,
    brand: outlet?.business?.name
      ? {
          "@type": "Brand",
          name: outlet.business.name,
        }
      : outlet?.name
        ? {
            "@type": "Brand",
            name: outlet.name,
          }
        : undefined,
    offers: price
      ? {
          "@type": "Offer",
          price,
          priceCurrency: "IDR",
          availability:
            product.status === "ACTIVE"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: canonicalUrl,
          seller: outlet?.name
            ? {
                "@type": "Organization",
                name: outlet.name,
              }
            : undefined,
        }
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
