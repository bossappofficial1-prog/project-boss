"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "@/hooks/useI18n";
import { Button } from "../ui/button";
import { Heart, MapPin, Package, Phone, Share2, Store, Wrench, Clock, MessageCircle, Navigation, ChevronRight, Search, X } from "lucide-react";
import { ShareOutlet } from "../shared/ShareOutlet";
import { ImageRender } from "../shared/Image";
import { resolveCustomerImageUrl } from "@/lib/url";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProductCard from "./ProductCard";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Outlet } from "@/services/outlets";
import { Product as ProductService } from "@/services/product";
import { EmptyState, ErrorState, LoadingState } from "../Base";
import { OperatingHourType, OutletType } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { DAY_NAMES, LanguageType } from "@/constants";
import { formatTime, toMapDestination } from "@/lib/utils";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { EmptyStates } from "../base/EmptyStates";
import { ImageColorThief } from "../shared/ImageColorThief";
import { Input } from "../ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchProductsByOutlet } from "@/hooks/useSearchProductsByOutlet";

const formatOperatingHours = (operatingHours: OperatingHourType[], locale: LanguageType) => {
  if (typeof window === "undefined") return;
  const dayNames = DAY_NAMES[locale];

  const sortedHours = [...operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return sortedHours.map((hour) => ({
    ...hour,
    dayName: dayNames[hour.dayOfWeek],
    formattedOpenTime: formatTime(new Date(hour.openTime)),
    formattedCloseTime: formatTime(new Date(hour.closeTime)),
  }));
};

// Helper function to get current day status
const getCurrentDayStatus = (operatingHours: OperatingHourType[], outletIsOpen: boolean) => {
  if (typeof window === "undefined") return;
  const today = new Date().getDay();
  const todayHours = operatingHours.find((hour) => hour.dayOfWeek === today);
  const t = useTranslations("outletDetail");

  if (!todayHours || !todayHours.isOpen || !outletIsOpen) {
    return { isOpen: false, message: t("closedToday") };
  }

  const now = new Date();
  const openTime = new Date(todayHours.openTime);
  const closeTime = new Date(todayHours.closeTime);

  // Set dates to today for comparison
  openTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  closeTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

  if (now >= openTime && now <= closeTime) {
    return {
      isOpen: true,
      message: t("openUntil", { time: formatTime(closeTime) }),
    };
  } else if (now < openTime) {
    return {
      isOpen: false,
      message: t("opensAt", { time: formatTime(openTime) }),
    };
  } else {
    return { isOpen: false, message: t("closedToday") };
  }
};

const OperatingHoursTab = ({
  operatingHours,
  outletOpen,
}: {
  operatingHours: OperatingHourType[];
  outletOpen: boolean;
}) => {
  const locale = useSearchParams().get("locale") as LanguageType;
  const formattedHours = formatOperatingHours(operatingHours, locale);
  const currentStatus = getCurrentDayStatus(operatingHours, outletOpen);
  const today = new Date().getDay();
  const t = useTranslations("outletDetail");
  const isOpen = outletOpen && currentStatus?.isOpen;

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 p-4 border border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isOpen ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("currentStatus")}</p>
              <p className="text-xs text-muted-foreground">{currentStatus?.message}</p>
            </div>
          </div>
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
            {isOpen ? t("open") : t("closed")}
          </Badge>
        </div>
      </div>

      {/* Schedule list */}
      <div className="space-y-1.5">
        {formattedHours?.map((hour) => (
          <div
            key={hour.id}
            className={`flex justify-between items-center px-4 py-3 rounded-lg transition-colors ${hour.dayOfWeek === today
              ? "bg-primary/5 border border-primary/15 shadow-sm"
              : "hover:bg-muted/50"
              }`}>
            <div className="flex items-center gap-2.5">
              <div className={`h-1.5 w-1.5 rounded-full ${hour.dayOfWeek === today ? "bg-primary" : "bg-muted-foreground/30"}`} />
              <span className={`text-sm ${hour.dayOfWeek === today ? "font-semibold text-primary" : "font-medium"}`}>
                {hour.dayName}
              </span>
              {hour.dayOfWeek === today && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {t("today")}
                </span>
              )}
            </div>
            <div className="text-right">
              {hour.isOpen ? (
                <span className={`text-sm tabular-nums ${hour.dayOfWeek === today ? "font-semibold" : ""}`}>
                  {hour.formattedOpenTime} — {hour.formattedCloseTime}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">{t("closed")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function LeftContentAppBarOutlet({
  handleToggleFavorite,
  isOutletFavorite,
  outlet,
}: {
  handleToggleFavorite: () => void;
  isOutletFavorite: boolean;
  outlet: OutletType;
}) {
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full backdrop-blur-sm"
        onClick={handleToggleFavorite}>
        <Heart
          className={`w-4 h-4 ${isOutletFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
        />
      </Button>
      <ShareOutlet
        outlet={{
          id: outlet.id,
          name: outlet.name,
          address: outlet.address,
          image: outlet.image || undefined,
        }}>
        <Button variant="ghost" size="sm" className="p-0 backdrop-blur-sm rounded-full">
          <Share2 className="w-4 h-4" />
        </Button>
      </ShareOutlet>
    </>
  );
}

const SESSION_KEY = "prev_page_to_outlet";

export function OutletContent({ outletId }: { outletId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { setAppBar, resetAppBar } = useAppBarV2();
  const [prevPage] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(SESSION_KEY);
  });

  const [selectedTabs, setSelectedTabs] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const storedSelectedTabs = localStorage.getItem("selectedTabs");
    return storedSelectedTabs ?? "products";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const from = useSearchParams().get("from");

  const router = useRouter();

  const t = useTranslations("outletDetail");

  const results = useQueries({
    queries: [
      {
        queryKey: ["outlet", outletId],
        queryFn: () => Outlet.getDetail(outletId),
        enabled: !!outletId,
      },
      {
        queryKey: ["products", outletId],
        queryFn: () => ProductService.getAllByOutlet(outletId),
        enabled: !!outletId && !debouncedSearchQuery,
      },
    ],
  });

  const [outletQuery, productQuery] = results;

  const trimmedSearch = debouncedSearchQuery.trim();

  const searchResult = useSearchProductsByOutlet({
    outletId,
    search: trimmedSearch,
    enabled: !!trimmedSearch,
  });

  const displayedProducts = useMemo(() => {
    if (trimmedSearch && searchResult.data) {
      return searchResult.data.data ?? [];
    }
    return productQuery.data ?? [];
  }, [trimmedSearch, searchResult.data, productQuery.data]);

  const services = useMemo(
    () => displayedProducts?.filter((p) => p.type === "SERVICE") ?? [],
    [displayedProducts],
  );
  const goods = useMemo(
    () => displayedProducts?.filter((p) => p.type === "GOODS") ?? [],
    [displayedProducts],
  );
  const isOutletFavorite = outletQuery.data ? isFavorite(outletQuery.data.id) : false;

  const isLoadingSearch = trimmedSearch && searchResult.isLoading;

  useEffect(() => {
    if (typeof window !== "undefined" && from && from !== "") {
      sessionStorage.setItem(SESSION_KEY, from);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }

    const outletData = outletQuery.data;

    if (outletData) {
      let onLeftClickHandler: (() => void) | undefined;

      if (prevPage == "search" && from == "product") {
        onLeftClickHandler = () => router.replace("/search");
      } else if (prevPage == "nearby" && from == "product") {
        onLeftClickHandler = () => router.push("/nearby");
      } else if (from === "product" || from === "share") {
        onLeftClickHandler = () => router.push("/");
      } else if (from === "search" || from === "favorites" || from == "nearby") {
        onLeftClickHandler = () => router.back();
      } else {
        onLeftClickHandler = () => router.back();
      }

      setAppBar({
        title: "Outlet",
        subtitle: outletData.name,
        showBackButton: true,
        centerTitle: true,
        showThemeToggle: false,
        showPartnerToggle: false,
        ...(onLeftClickHandler ? { onLeftClick: onLeftClickHandler } : {}),
      });
    }

    return () => {
      resetAppBar();
    };
  }, [setAppBar, resetAppBar, outletQuery.data?.name]);

  const handleToggleFavorite = useCallback(() => {
    if (!outletQuery.data) return;
    const outlet = outletQuery.data;
    toggleFavorite({
      id: outlet.id,
      name: outlet.name || t("outletNotFound"),
      address: outlet.address,
      image: outlet.image || undefined,
      isOpen: outlet.isOpen,
    });
  }, [
    toggleFavorite,
    outletQuery.data?.id,
    outletQuery.data?.name,
    outletQuery.data?.address,
    outletQuery.data?.image,
    outletQuery.data?.isOpen,
  ]);

  // useEffect(() => {
  //   const outletData = outletQuery.data;

  //   if (outletData) {
  //     setAppBar({
  //       rightContent: (
  //         <LeftContentAppBarOutlet
  //           handleToggleFavorite={handleToggleFavorite}
  //           isOutletFavorite={isOutletFavorite}
  //           outlet={outletData}
  //         />
  //       ),
  //     });
  //   }
  // }, [setAppBar, isOutletFavorite, outletQuery.data?.id]);

  const handleWhatsAppChat = useCallback(() => {
    if (!outletQuery.data?.phone) return;
    const outlet = outletQuery.data;
    const message = encodeURIComponent(`${t("whatsappMessage", { name: outlet.name })}`);
    const whatsappUrl = `https://wa.me/${(outlet.phone?.startsWith("+62") ? outlet.phone : "+62" + outlet.phone.slice(1)).replace(/\D/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  }, [outletQuery.data?.phone, outletQuery.data?.name]);

  if (outletQuery.isLoading) {
    return <LoadingState />;
  }
  if ((results[0].error as any)?.response.status == 404)
    return (
      <EmptyStates.NotFound
        action={{
          label: "Back to Home",
          onClick() {
            window.location.href = "/";
          },
        }}
      />
    );

  if (outletQuery.isError) {
    return <ErrorState />;
  }

  if (!outletQuery.data) {
    return <EmptyState title={t("outletNotFound")} />;
  }

  const outlet = outletQuery.data!;

  return (
    <div className="pb-20">
      {/* Hero Image */}
      <div className="relative h-52 sm:h-64 bg-muted -mx-3 -mt-3 overflow-hidden">
        {outlet.image ? (
          <ImageColorThief
            src={resolveCustomerImageUrl(outlet.image)}
            alt={outlet.name}
            className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/30 to-primary/50">
            <Store className="w-16 h-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Outlet Info Card - overlapping hero */}
      <div className="relative -mt-16">
        <div className="rounded-xl bg-background border border-border/60 shadow-lg p-4 space-y-3">
          {/* Status + Name */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={outlet.status ? "default" : "secondary"}
                  className={`rounded-full text-[10px] px-2 py-0.5 font-semibold ${outlet.status ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {outlet.status ? t("open") : t("closed")}
                </Badge>
              </div>
              <h1 className="text-lg font-bold leading-tight line-clamp-2">{outlet.name}</h1>
            </div>
          </div>

          {/* Address */}
          <button
            type="button"
            onClick={() => toMapDestination(outlet.latitude, outlet.longitude)}
            className="flex items-start gap-2 text-left w-full group">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                {outlet.address}
              </p>
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 mt-0.5">
                <Navigation className="w-2.5 h-2.5" />
                {t("openMap")}
              </span>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-1">
            {outlet.phone && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-lg text-xs font-medium gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                onClick={handleWhatsAppChat}>
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={`${outlet.phone ? '' : 'flex-1'} h-9 rounded-lg text-xs font-medium gap-1.5`}
              onClick={handleToggleFavorite}>
              <Heart className={`w-3.5 h-3.5 transition-colors ${isOutletFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isOutletFavorite ? t("favorited") : t("favorite")}
            </Button>
            <ShareOutlet
              outlet={{
                id: outlet.id,
                name: outlet.name,
                address: outlet.address,
                image: outlet.image || undefined,
              }}>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg flex-shrink-0">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </ShareOutlet>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-5">
        <Tabs
          defaultValue={selectedTabs}
          onValueChange={(value) => {
            setSelectedTabs(value);
            localStorage.setItem("selectedTabs", value);
          }}
          className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11 rounded-lg bg-muted/60 p-1">
            {[
              { value: "products", icon: Package, label: t("products"), count: goods.length },
              { value: "services", icon: Wrench, label: t("services"), count: services.length },
              { value: "hours", icon: Clock, label: t("openingHours") },
            ].map(({ value, icon: Icon, label, count }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 rounded-md text-xs font-medium data-[state=active]:shadow-sm">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {count !== undefined && (
                  <span className="text-[10px] tabular-nums opacity-70">({count})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Search Input - only show in products and services tabs */}
          {(selectedTabs === "products" || selectedTabs === "services") && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 rounded-lg border-border/60 focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Search Results Count */}
          {trimmedSearch && !isLoadingSearch && (selectedTabs === "products" || selectedTabs === "services") && (
            <div className="mt-2 px-1">
              <p className="text-xs text-muted-foreground">
                {t("searchResults", { count: displayedProducts.length })}
              </p>
            </div>
          )}

          <TabsContent value="products" className="mt-3 space-y-2">
            {isLoadingSearch ? (
              <LoadingState />
            ) : goods.length ? (
              <div className="grid gap-2">
                {goods.map((p) => (
                  <ProductCard key={p.id} product={p} outlet={outlet} />
                ))}
              </div>
            ) : trimmedSearch ? (
              <EmptyState 
                title={t("noSearchResults")} 
                description={t("noSearchResultsDescription")} 
              />
            ) : (
              <EmptyState title={t("noProducts")} description={t("noProductsDescription")} />
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-3 space-y-2">
            {isLoadingSearch ? (
              <LoadingState />
            ) : services.length ? (
              <div className="grid gap-2">
                {services.map((p) => (
                  <ProductCard key={p.id} product={p} outlet={outlet} />
                ))}
              </div>
            ) : trimmedSearch ? (
              <EmptyState 
                title={t("noSearchResults")} 
                description={t("noSearchResultsDescription")} 
                icon={<Wrench className="text-muted-foreground" />}
              />
            ) : (
              <EmptyState
                title={t("noServices")}
                description={t("noServicesDescription")}
                icon={<Wrench className="text-muted-foreground" />}
              />
            )}
          </TabsContent>

          <TabsContent value="hours" className="mt-3 space-y-2">
            {outlet.operatingHours?.length ? (
              <OperatingHoursTab
                operatingHours={outlet.operatingHours}
                outletOpen={outlet.isOpen}
              />
            ) : (
              <EmptyState
                title={t("noOperatingHours")}
                description={t("noOperatingHoursDescription")}
                icon={<Clock className="text-muted-foreground" />}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
