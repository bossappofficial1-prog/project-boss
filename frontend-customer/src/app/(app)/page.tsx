"use client"

import React, { useEffect, Suspense } from "react";
import { useFeaturedOutlets } from '@/hooks/useFeaturedOutlets';
import { OutletCard } from "@/components/home/OutletCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/Base";
import { useUserPosition } from "@/hooks/userUserPosition";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SearchDropdown, SearchInput } from "@/components/shared/search";
import { useTranslations } from "@/hooks/useI18n";
import { useNearbyOutletsSingle } from "@/hooks/useNearbyOutlets";
import { DivXScroll } from "@/components/shared/DivXScroll";
import { useAppBarV2 } from "@/context/AppBarContextV2";

function NearbyOutlets() {
  const t = useTranslations("nearbyOutlets")
  const { position, loading } = useUserPosition()
  const { data: outlets, isLoading: nearbyLoading, error } = useNearbyOutletsSingle({ latitude: position?.[0], longitude: position?.[1] })

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium">{t("title")}</h3>
        <Link href={"/nearby"} className="text-sm text-primary">{t("viewAll")}</Link>
      </div>
      {loading || nearbyLoading
        ? <LoadingState message={t("loading")} />
        : (
          <div className="space-y-2">
            {outlets && outlets.length > 0
              ? outlets.map((outlet, index: any) => (
                <OutletCard key={index + outlet.id} alignment="horizontal" outlet={outlet} />
              ))
              : <EmptyState title={t("empty")} />}
          </div>
        )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState message="Loading home page..." />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const tp = useTranslations("featuredOutlets")
  const { setAppBar, resetAppBar } = useAppBarV2()

  useEffect(() => {
    setAppBar({
      title: "Home",
      showSearch: true,
      onSearch: (query: string) => router.push(`/search?q=${encodeURIComponent(query)}`),
    })

    return () => resetAppBar()
  }, [])

  return (
    <div className="space-y-4">
      <NearbyOutlets />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium">{tp("title")}</h2>
        </div>
        {(() => {
          const { data, isLoading, error, refetch } = useFeaturedOutlets();

          if (isLoading) return (
            <LoadingState message={tp("loading")} />
          );

          if (error) return <ErrorState onRetry={() => refetch()} message={error.message === "Network Error" ? "Terjadi kesalahan internet" : undefined} />;
          if (!data || data.length === 0) return <EmptyState title={tp("empty")} />;

          return (
            <DivXScroll className="gap-2 p-2">
              {data.slice(0, 5).map((o: any) => (
                <div key={o.id} className="w-[15em] flex-none">
                  <OutletCard outlet={o} alignment="vertical" />
                </div>
              ))}
            </DivXScroll>
          );
        })()}
      </section>
    </div>
  );
}

