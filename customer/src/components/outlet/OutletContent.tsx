"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "@/hooks/useI18n";
import { Button } from "../ui/button";
import { Heart, MapPin, Package, Phone, Share2, Store, Wrench, Clock, Navigation, ChevronRight, Search, X, Ticket, UtensilsCrossed, Instagram } from "lucide-react";
import { ShareOutlet } from "../shared/ShareOutlet";
import { resolveCustomerImageUrl } from "@/lib/url";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProductCard from "./ProductCard";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
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
import { useLocale, useLocalizedPath } from "@/hooks/useI18n";

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
  const locale = useLocale() as LanguageType;
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

interface OutletContentProps {
  slug: string;
  initialOutletData?: OutletType;
  initialProductsData?: import("@/types/product").Product[];
}

export function OutletContent({ slug, initialOutletData, initialProductsData }: OutletContentProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { setAppBar, resetAppBar } = useAppBarV2();
  const [prevPage] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(SESSION_KEY);
  });

  const [selectedTabs, setSelectedTabs] = useState<string>("products");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSelectedTabs = localStorage.getItem("selectedTabs");
      if (storedSelectedTabs) {
        setSelectedTabs(storedSelectedTabs);
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const locale = useLocale();
  const withLocalizedPath = useLocalizedPath();

  const router = useRouter();
  const { setTableId, tableId: storedTableId, tableName: storedTableName, tableOutletId: storedTableOutletId } = useCart();

  const tableIdFromUrl = searchParams.get("tableId");
  const tableNameFromUrl = searchParams.get("tableName");

  // Prefetch likely back destinations
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/search");
    router.prefetch("/nearby");
    router.prefetch("/favorites");
  }, [router]);
  const t = useTranslations("outletDetail");

  const results = useQueries({
    queries: [
      {
        queryKey: ["outlet", slug],
        queryFn: () => Outlet.getDetail(slug),
        enabled: !!slug,
        initialData: initialOutletData,
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: 'always',
        refetchInterval: 1000 * 60,
      },
      {
        queryKey: ["products", slug],
        queryFn: () => ProductService.getAllByOutlet(slug),
        enabled: !!slug && !debouncedSearchQuery,
        initialData: initialProductsData,
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: 'always',
        refetchInterval: 1000 * 60,
      },
    ],
  });

  const [outletQuery, productQuery] = results;

  const trimmedSearch = debouncedSearchQuery.trim();
  useEffect(() => {
    if (tableIdFromUrl && outletQuery.data) {
      setTableId(tableIdFromUrl, tableNameFromUrl, outletQuery.data.id);
    }
  }, [tableIdFromUrl, tableNameFromUrl, outletQuery.data?.id, setTableId]);

  const searchResult = useSearchProductsByOutlet({
    outletId: results[0].data?.id!,
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
  const tickets = useMemo(
    () => displayedProducts?.filter((p) => p.type === "TICKET") ?? [],
    [displayedProducts],
  );
  const isOutletFavorite = outletQuery.data ? isFavorite(outletQuery.data.id) : false;

  const isLoadingSearch = trimmedSearch && searchResult.isLoading;

  // Tab visibility depends on outlet.type (backend enum: FNB | RETAIL | EVENT | SERVICE | CUSTOM)
  const tabDefinitions = useMemo(() => {
    const all = [
      { value: "products", icon: Package, label: t("products"), count: goods.length },
      { value: "services", icon: Wrench, label: t("services"), count: services.length },
      { value: "tickets", icon: Ticket, label: "Tiket", count: tickets.length },
      { value: "hours", icon: Clock, label: t("openingHours") },
    ];

    switch (outletQuery.data?.type) {
      case "RETAIL":
        return all.filter((td) => td.value === "products" || td.value === "hours");
      case "SERVICE":
        return all.filter((td) => td.value === "services" || td.value === "hours");
      case "EVENT":
        return all.filter((td) => td.value === "tickets" || td.value === "hours");
      default:
        // FNB, CUSTOM and others: show all
        return all;
    }
  }, [outletQuery.data?.type, goods.length, services.length, tickets.length, t]);

  const availableTabValues = useMemo(
    () => tabDefinitions.map((tab) => tab.value),
    [tabDefinitions],
  );

  useEffect(() => {
    if (!availableTabValues.includes(selectedTabs)) {
      const fallbackTab = availableTabValues[0] ?? "products";
      setSelectedTabs(fallbackTab);
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedTabs", fallbackTab);
      }
    }
  }, [availableTabValues, selectedTabs]);

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
        onLeftClickHandler = () => router.replace(withLocalizedPath("/search"));
      } else if (prevPage == "nearby" && from == "product") {
        onLeftClickHandler = () => router.push(withLocalizedPath("/nearby"));
      } else if (from === "product" || from === "share") {
        onLeftClickHandler = () => router.push(withLocalizedPath("/"));
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
  }, [setAppBar, resetAppBar, outletQuery.data?.name, prevPage, from, router, withLocalizedPath]);

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
            if (locale) {
              window.location.href = withLocalizedPath("/");
              return;
            }
            window.location.href = "/";
          },
        }}
      />
    );

  if (outletQuery.isError) {
    return <ErrorState />;
  }

  if (!outletQuery.data) return null

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

      {/* Table Ordering Indicator - Floating Pill */}
      {storedTableId && storedTableOutletId === outletQuery.data?.id && (
        <div className="fixed bottom-5 left-0 right-0 z-30 px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/95 text-primary-foreground backdrop-blur-md py-2.5 px-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-between border border-white/10 pointer-events-auto max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] font-bold opacity-80 uppercase tracking-[0.1em] leading-none mb-1">
                  {t("tableOrderingActive")}
                </p>
                <p className="text-sm font-extrabold leading-none">
                  {t("tableIndicator", { tableId: storedTableName || storedTableId })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full border border-white/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{t("active")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Outlet Info Card - overlapping hero */}
      <div className="relative -mt-16">
        <div className="rounded-xl bg-background border border-border/60 shadow-lg p-4 space-y-3">
          {/* Status + Name */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant={outlet.status ? "default" : "secondary"}
                  className={`rounded-full text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider ${outlet.status ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {outlet.status ? t("open") : t("closed")}
                </Badge>
              </div>
              <h1 className="text-xl font-extrabold leading-tight tracking-tight line-clamp-2 text-foreground/90">{outlet.name}</h1>
            </div>
          </div>

          {/* Address */}
          <button
            type="button"
            onClick={() => toMapDestination(outlet.latitude, outlet.longitude)}
            className="flex items-start gap-3 text-left w-full group pt-1">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-300">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-muted-foreground/90 leading-relaxed line-clamp-2 group-hover:text-foreground transition-colors">
                {outlet.address}
              </p>
              <span className="text-[11px] text-primary font-bold flex items-center gap-1 mt-1 transition-transform group-hover:translate-x-0.5">
                <Navigation className="w-3 h-3" />
                {t("openMap")}
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-1">
            {outlet.phone && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-lg text-xs font-medium gap-1.5 border-green-200 text-[#10b981] hover:bg-green-50 hover:text-green-800"
                onClick={handleWhatsAppChat}>
                {/* <MessageCircle className="w-3.5 h-3.5" /> */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="128" height="128">
                  <defs>
                    <filter id="svg-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.25" />
                    </filter>
                  </defs>
                  <svg x="0.0" y="0.0" width="100" height="100" viewBox="0 0 16 16" fill="#10b981" filter="url(#svg-shadow)">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.601 2.326zM7.994 14.521a6.57 6.57 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.5c.003-3.613 2.941-6.55 6.557-6.55 1.753 0 3.4.683 4.634 1.917A6.54 6.54 0 0 1 14.5 7.93c-.004 3.615-2.942 6.55-6.555 6.55m3.544-4.8c-.194-.097-1.14-.563-1.317-.626-.176-.065-.304-.097-.43.097-.128.19-.495.626-.607.75-.113.127-.225.143-.419.046-.194-.097-.82-.303-1.562-.963-.577-.514-.967-1.149-1.08-1.343-.113-.194-.012-.299.085-.395.088-.087.195-.225.293-.338.097-.113.128-.19.194-.317.065-.13.033-.243-.016-.34-.049-.097-.43-1.036-.59-1.42-.156-.375-.312-.324-.43-.33-.11-.005-.238-.006-.366-.006a.71.71 0 0 0-.511.239c-.18.195-.684.668-.684 1.629s.7 1.912.8 2.046c.1.134 1.378 2.103 3.338 2.946.467.201.83.322 1.114.412.47.149.897.128 1.236.077.378-.057 1.14-.467 1.3-.918.162-.452.162-.84.113-.919-.049-.078-.176-.127-.37-.224z" />
                  </svg>
                </svg>
                WhatsApp
              </Button>
            )}
            {outlet.instagramUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg text-xs font-medium gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800"
                onClick={() => window.open(outlet.instagramUrl?.startsWith("https://")
                  ? outlet.instagramUrl : `https://www.instagram.com/${outlet.instagramUrl}`, "_blank")}>
                <Instagram className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instagram</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={`${outlet.phone ? '' : 'flex-1'} h-9 rounded-lg text-xs font-medium gap-1.5`}
              onClick={handleToggleFavorite}>
              <Heart className={`w-3.5 h-3.5 transition-colors ${isOutletFavorite ? "fill-red-500 text-red-500" : ""}`} />
              <span className="hidden sm:inline">
                {isOutletFavorite ? t("favorited") : t("favorite")}
              </span>
            </Button>
            <ShareOutlet
              outlet={{
                id: outlet.slug!,
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
          value={selectedTabs}
          onValueChange={(value) => {
            setSelectedTabs(value);
            localStorage.setItem("selectedTabs", value);
          }}
          className="w-full">
          <TabsList
            className="grid w-full h-11 rounded-lg bg-muted/60 p-1"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, tabDefinitions.length)}, minmax(0, 1fr))` }}>
            {tabDefinitions.map(({ value, icon: Icon, label, count }) => (
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
          {(selectedTabs === "products" || selectedTabs === "services" || selectedTabs === "tickets") && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 rounded-lg text-sm border-border/60 focus-visible:ring-primary/20"
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
          {trimmedSearch && !isLoadingSearch && (selectedTabs === "products" || selectedTabs === "services" || selectedTabs === "tickets") && (
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
                  <ProductCard key={p.id} product={p} outlet={outlet} locale={locale} />
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
                  <ProductCard key={p.id} product={p} outlet={outlet} locale={locale} />
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

          <TabsContent value="tickets" className="mt-3 space-y-2">
            {isLoadingSearch ? (
              <LoadingState />
            ) : tickets.length ? (
              <div className="grid gap-2">
                {tickets.map((p) => (
                  <ProductCard key={p.id} product={p} outlet={outlet} locale={locale} />
                ))}
              </div>
            ) : trimmedSearch ? (
              <EmptyState
                title={t("noSearchResults")}
                description={t("noSearchResultsDescription")}
                icon={<Ticket className="text-muted-foreground" />}
              />
            ) : (
              <EmptyState
                title="Belum ada tiket"
                description="Outlet ini belum menjual tiket"
                icon={<Ticket className="text-muted-foreground" />}
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
