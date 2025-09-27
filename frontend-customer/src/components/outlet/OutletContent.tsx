'use client'

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "@/hooks/useI18n";
import { Button } from "../ui/button";
import { Heart, MapPin, Package, Phone, Share2, Store, Wrench, Clock } from "lucide-react";
import { ShareOutlet } from "../shared/ShareOutlet";
import { ImageRender } from "../shared/Image";
import { resolveCustomerImageUrl } from "@/lib/url";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProductCard from "./ProductCard";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Outlet } from "@/services/outlets";
import { Product } from "@/services/product";
import { EmptyState, ErrorState, LoadingState } from "../Base";
import { OperatingHourType, OutletType } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { DAY_NAMES, LanguageType } from "@/constants";
import { formatTime, toMapDestination } from "@/lib/utils";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { EmptyStates } from "../base/EmptyStates";

const formatOperatingHours = (operatingHours: OperatingHourType[], locale: LanguageType) => {
    if (typeof window === "undefined") return
    const dayNames = DAY_NAMES[locale]

    const sortedHours = [...operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return sortedHours.map(hour => ({
        ...hour,
        dayName: dayNames[hour.dayOfWeek],
        formattedOpenTime: formatTime(new Date(hour.openTime)),
        formattedCloseTime: formatTime(new Date(hour.closeTime))
    }));
};

// Helper function to get current day status
const getCurrentDayStatus = (operatingHours: OperatingHourType[], outletIsOpen: boolean) => {
    if (typeof window === "undefined") return
    const today = new Date().getDay();
    const todayHours = operatingHours.find(hour => hour.dayOfWeek === today);
    const t = useTranslations("outletDetail")

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
            message: t("openUntil", { time: formatTime(closeTime) })
        };
    } else if (now < openTime) {
        return {
            isOpen: false,
            message: t("opensAt", { time: formatTime(openTime) })
        };
    } else {
        return { isOpen: false, message: t("closedToday") };
    }
};

const OperatingHoursTab = ({ operatingHours, outletOpen }: { operatingHours: OperatingHourType[], outletOpen: boolean }) => {
    const locale = useSearchParams().get("locale") as LanguageType
    const formattedHours = formatOperatingHours(operatingHours, locale);
    const currentStatus = getCurrentDayStatus(operatingHours, outletOpen);
    const today = new Date().getDay();
    const t = useTranslations('outletDetail');
    const isOpen = outletOpen && currentStatus?.isOpen

    return (
        <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{t("currentStatus")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={isOpen ? "default" : "secondary"}
                        className={`${isOpen ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500 text-white"}`}
                    >
                        {isOpen ? t("open") : t("closed")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{currentStatus?.message}</span>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">{t("operatingHours")}</h3>
                <div className="space-y-2">
                    {formattedHours?.map((hour) => (
                        <div
                            key={hour.id}
                            className={`flex justify-between items-center p-3 rounded-lg border ${hour.dayOfWeek === today ? 'bg-primary/5 border-primary/20' : 'bg-background'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`font-medium ${hour.dayOfWeek === today ? 'text-primary' : ''}`}>
                                    {hour.dayName}
                                </span>
                                {hour.dayOfWeek === today && (
                                    <Badge variant="outline" className="text-xs">
                                        {t("today")}
                                    </Badge>
                                )}
                            </div>
                            <div className="text-right">
                                {hour.isOpen ? (
                                    <span className="text-sm text-foreground">
                                        {hour.formattedOpenTime} - {hour.formattedCloseTime}
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">{t("closed")}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function LeftContentAppBarOutlet({
    handleToggleFavorite,
    isOutletFavorite,
    outlet
}: { handleToggleFavorite: () => void, isOutletFavorite: boolean, outlet: OutletType }) {
    return <>
        <Button
            variant="secondary"
            size="sm"
            className="rounded-full backdrop-blur-sm"
            onClick={handleToggleFavorite}
        >
            <Heart className={`w-4 h-4 ${isOutletFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
        <ShareOutlet outlet={{
            id: outlet.id,
            name: outlet.name,
            address: outlet.address,
            image: outlet.image || undefined
        }}>
            <Button
                variant="ghost"
                size="sm"
                className="p-0 backdrop-blur-sm rounded-full"
            >
                <Share2 className="w-4 h-4" />
            </Button>
        </ShareOutlet>
    </>
}

const SESSION_KEY = "prev_page_to_outlet"

export function OutletContent({ outletId }: { outletId: string }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { setAppBar, resetAppBar } = useAppBarV2()
    const [prevPage] = useState(() => {
        if (typeof window === "undefined") return ""
        return sessionStorage.getItem(SESSION_KEY)
    })

    const [selectedTabs, setSelectedTabs] = useState<string | undefined>(() => {
        if (typeof window === "undefined") return undefined;
        const storedSelectedTabs = localStorage.getItem("selectedTabs")
        return storedSelectedTabs ?? "products"
    })

    const from = useSearchParams().get("from")

    const router = useRouter()

    const t = useTranslations('outletDetail');

    const results = useQueries({
        queries: [
            { queryKey: ["outlet", outletId], queryFn: () => Outlet.getDetail(outletId), enabled: !!outletId },
            { queryKey: ["products", outletId], queryFn: () => Product.getAllByOutlet(outletId), enabled: !!outletId }
        ],
    });

    const [outletQuery, productQuery] = results;

    const services = useMemo(() => productQuery.data?.filter(p => p.type === "SERVICE") ?? [], [productQuery.data]);
    const goods = useMemo(() => productQuery.data?.filter(p => p.type === "GOODS") ?? [], [productQuery.data]);
    const isOutletFavorite = outletQuery.data ? isFavorite(outletQuery.data.id) : false;

    useEffect(() => {
        if (typeof window !== "undefined" && from && from !== "") {
            sessionStorage.setItem(SESSION_KEY, from)
        } else { sessionStorage.removeItem(SESSION_KEY) }

        const outletData = outletQuery.data;
        console.log(prevPage, from);

        if (outletData) {
            let onLeftClickHandler: (() => void) | undefined;

            if (prevPage == "search" && from == "product") {
                onLeftClickHandler = () => router.replace('/search');
            } else if (prevPage == "nearby" && from == "product") {
                onLeftClickHandler = () => router.push("/nearby");
            } else if (from === "product") {
                onLeftClickHandler = () => router.push('/');
            } else if (from === "search" || from === "favorites" || from == "nearby") {
                onLeftClickHandler = () => router.back();
            } else {
                onLeftClickHandler = () => router.push('/');
            }

            setAppBar({
                title: "Outlet",
                subtitle: outletData.name,
                showBackButton: true,
                centerTitle: true,
                ...(onLeftClickHandler ? { onLeftClick: onLeftClickHandler } : {})
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
    }, [toggleFavorite, outletQuery.data?.id, outletQuery.data?.name, outletQuery.data?.address, outletQuery.data?.image, outletQuery.data?.isOpen]);

    useEffect(() => {
        const outletData = outletQuery.data;

        if (outletData) {
            setAppBar({
                rightContent: (
                    <LeftContentAppBarOutlet
                        handleToggleFavorite={handleToggleFavorite}
                        isOutletFavorite={isOutletFavorite}
                        outlet={outletData}
                    />
                )
            });
        }
    }, [setAppBar, isOutletFavorite, outletQuery.data?.id]);

    const handleWhatsAppChat = useCallback(() => {
        if (!outletQuery.data?.phone) return;
        const outlet = outletQuery.data;
        const message = encodeURIComponent(`${t("whatsappMessage", { name: outlet.name })}`);
        const whatsappUrl = `https://wa.me/${(outlet.phone?.startsWith("+62") ? outlet.phone : "+62" + outlet.phone.slice(1)).replace(/\D/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }, [outletQuery.data?.phone, outletQuery.data?.name]);

    if (outletQuery.isLoading) {
        return <LoadingState />;
    }
    if ((results[0].error as any)?.response.status == 404) return <EmptyStates.NotFound action={{
        label: "Back to Home", onClick() {
            window.location.href = '/'
        },
    }} />

    if (outletQuery.isError) {
        return <ErrorState />;
    }

    if (!outletQuery.data) {
        return <EmptyState title={t("outletNotFound")} />;
    }

    const outlet = outletQuery.data!

    return (
        <div className="pb-20">
            <div className="relative h-52 bg-muted -mx-4 -mt-4">
                {outlet.image ? (
                    <ImageRender
                        src={resolveCustomerImageUrl(outlet.image)}
                        alt={outlet.name}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                        <Store className="w-20 h-20 text-primary/60" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge
                            variant={outlet.status ? "default" : "secondary"}
                            className={`${outlet.status ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500 text-white"}`}
                        >
                            {outlet.status ? t("open") : t("closed")}
                        </Badge>
                    </div>
                    <span
                        onClick={() => toMapDestination(outlet.latitude, outlet.longitude)}
                        className="flex gap-1 items-center text-white/90 text-sm mb-3 hover:text-white cursor-pointer"
                    >
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs truncate">{outlet.address}</span>
                    </span>
                    {outlet.phone && (
                        <div onClick={handleWhatsAppChat} className="flex cursor-pointer items-center gap-1 text-white/80 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{outlet.phone}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3 mt-6">
                <Tabs
                    defaultValue={selectedTabs}
                    onValueChange={(value) => { setSelectedTabs(value); localStorage.setItem("selectedTabs", value) }}
                    className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-10">
                        <TabsTrigger value="products" className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">{t("products")} ({goods.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">{t("services")} ({services.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="hours" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">{t("openingHours")}</span>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="products" className="mt-2 space-y-4">
                        {goods.length > 0 ? (
                            <div className="grid gap-2">
                                {goods.map(product => (
                                    <ProductCard key={product.id} product={product} outlet={outlet} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title={t("noProducts")}
                                description={t("noProductsDescription")} />
                        )}
                    </TabsContent>
                    <TabsContent value="services" className="mt-2 space-y-4">
                        {services.length > 0 ? (
                            <div className="grid gap-2">
                                {services.map(product => (
                                    <ProductCard key={product.id} product={product} outlet={outlet} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title={t("noServices")}
                                description={t("noServicesDescription")}
                                icon={<Wrench className="text-muted-foreground" />}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="hours" className="mt-2 space-y-4">
                        {outlet.operatingHours && outlet.operatingHours.length > 0 ? (
                            <OperatingHoursTab operatingHours={outlet.operatingHours} outletOpen={outlet.isOpen} />
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