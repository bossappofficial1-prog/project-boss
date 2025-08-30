"use client"

import Image from "next/image";
import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useUser } from '@/hooks/useUser';
import { useFeaturedOutlets } from '@/hooks/useFeaturedOutlets';
import useFetch from "@/components/home/useFetch";
import { OutletCard } from "@/components/home/OutletCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/Base";
import { Star, Gift, ShoppingBag, Bell } from "lucide-react";
import { useUserPosition } from "@/hooks/userUserPosition";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppBarConfig } from "@/hooks/useAppBarConfig";
import { Button } from "@/components/ui/button";
import { Search, SearchDropdown, SearchInput } from "@/components/shared/search";
import { useTranslations } from "@/hooks/useI18n";
import { useNearbyOutletsSingle } from "@/hooks/useNearbyOutlets";
import { DivXScroll } from "@/components/shared/DivXScroll";
import { useAppBarV2 } from "@/context/AppBarContextV2";

// // Quick Stats Component - Restored with API calls but mobile design
// function QuickStats() {
//   const { data: user } = useUser();
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     favoriteOutlets: 0,
//     availablePromos: 0
//   });

//   useEffect(() => {
//     // Mock data for now - you can restore API calls later
//     if (user) {
//       setStats({
//         totalOrders: 12,
//         favoriteOutlets: 3,
//         availablePromos: 5
//       });
//     }
//   }, [user]);

//   if (!user) return null;

//   return (
//     <div className="grid grid-cols-3 gap-3 mb-4">
//       <div className="bg-card rounded-lg p-3 border text-center">
//         <div className="flex items-center justify-center mb-1">
//           <ShoppingBag className="w-4 h-4 text-primary" />
//         </div>
//         <p className="text-lg font-semibold">{stats.totalOrders}</p>
//         <p className="text-xs text-muted-foreground">Orders</p>
//       </div>
//       <div className="bg-card rounded-lg p-3 border text-center">
//         <div className="flex items-center justify-center mb-1">
//           <Star className="w-4 h-4 text-yellow-500" />
//         </div>
//         <p className="text-lg font-semibold">{stats.favoriteOutlets}</p>
//         <p className="text-xs text-muted-foreground">Favorites</p>
//       </div>
//       <div className="bg-card rounded-lg p-3 border text-center">
//         <div className="flex items-center justify-center mb-1">
//           <Gift className="w-4 h-4 text-green-500" />
//         </div>
//         <p className="text-lg font-semibold">{stats.availablePromos}</p>
//         <p className="text-xs text-muted-foreground">Promos</p>
//       </div>
//     </div>
//   );
// }

// // Recent Orders Component - Simplified
// function RecentOrders() {
//   const { data: orders, error } = useFetch('/orders/recent');

//   if (error || !orders || orders.length === 0) return null;

//   return (
//     <div className="mb-4">
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="text-base font-medium">Recent Orders</h3>
//         <Link href="/orders" className="text-sm text-primary hover:underline">View All</Link>
//       </div>
//       <div className="space-y-2">
//         {orders.slice(0, 3).map((order: any) => (
//           <div key={order.id} className="bg-card rounded-lg p-3 border">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
//                   <ShoppingBag className="w-4 h-4" />
//                 </div>
//                 <div>
//                   <p className="font-medium text-sm">{order.outlet_name}</p>
//                   <p className="text-xs text-muted-foreground">
//                     {order.items_count} items • {order.created_at}
//                   </p>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <p className="font-medium text-sm">Rp {order.total?.toLocaleString('id-ID')}</p>
//                 <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
//                   order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
//                     'bg-gray-100 text-gray-700'
//                   }`}>
//                   {order.status}
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // Promotions Component - Simplified
// function ActivePromotions() {
//   const { data: promos, error } = useFetch('/promos');

//   if (error || !promos || promos.length === 0) return null;

//   return (
//     <div className="mb-4">
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="text-base font-medium">Active Promotions</h3>
//         <Link href="/promos" className="text-sm text-primary hover:underline">View All</Link>
//       </div>
//       <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 hide-scrollbar">
//         {promos.slice(0, 5).map((promo: any) => (
//           <div key={promo.id} className="w-[200px] flex-none">
//             <div className="bg-primary rounded-lg p-3 text-primary-foreground">
//               <div className="flex items-center gap-2 mb-2">
//                 <Gift className="w-4 h-4" />
//                 <span className="text-xs font-medium">PROMO</span>
//               </div>
//               <h4 className="font-medium text-sm mb-1 line-clamp-1">{promo.title}</h4>
//               <p className="text-xs opacity-90 mb-2 line-clamp-2">{promo.description}</p>
//               <div className="flex items-center justify-between">
//                 <span className="text-xs bg-background/20 px-2 py-1 rounded">
//                   Save up to {promo.discount}%
//                 </span>
//                 <button className="text-xs bg-background text-primary px-2 py-1 rounded font-medium hover:bg-background/90 transition-colors">
//                   Use Now
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// Nearby Outlets Component - Simplified
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

const HOME_APP_BAR_CONFIG = {
  title: 'Home',
  showBackButton: false,
  showSearch: true,
  showMenu: false,
  variant: 'default' as const,
};

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
  const t = useTranslations("searchPage")
  const { setAppBar } = useAppBarV2()

  useEffect(() => {
    setAppBar({ title: "Home" })
  }, [])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* <AuthGreeting /> */}
      <Search
        onChange={handleSearch}
        namespace='outlets'
        size='md'
        onSearch={handleSearch}
        className='mb-4'
      >
        <SearchInput
          placeholder={t('searchPlaceholder')}
        />
        <SearchDropdown />
      </Search>

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

