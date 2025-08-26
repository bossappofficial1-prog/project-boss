'use client'

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "@/hooks/useI18n";
import { Button } from "../ui/button";
import { Heart, MapPin, Package, Phone, Share2, Store, Wrench, Clock } from "lucide-react";
import { ShareOutlet } from "../shared/ShareOutlet";
import { ImageRender } from "../shared/Image";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ProductCard from "./ProductCard";
import { useAppBar } from "@/context/AppBarContext";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { Outlet } from "@/services/outlets";
import { Product } from "@/services/product";
import { EmptyState, ErrorState, LoadingState } from "../Base";
import { OperatingHourType } from "@/types";

// Helper function to format operating hours
const formatOperatingHours = (operatingHours: OperatingHourType[]) => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const sortedHours = [...operatingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return sortedHours.map(hour => ({
        ...hour,
        dayName: dayNames[hour.dayOfWeek],
        formattedOpenTime: new Date(hour.openTime).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }),
        formattedCloseTime: new Date(hour.closeTime).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }));
};

// Helper function to get current day status
const getCurrentDayStatus = (operatingHours: OperatingHourType[]) => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayHours = operatingHours.find(hour => hour.dayOfWeek === today);

    if (!todayHours || !todayHours.isOpen) {
        return { isOpen: false, message: 'Tutup hari ini' };
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
            message: `Buka sampai ${closeTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}`
        };
    } else if (now < openTime) {
        return {
            isOpen: false,
            message: `Buka pukul ${openTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}`
        };
    } else {
        return { isOpen: false, message: 'Tutup hari ini' };
    }
};

// Operating Hours Component
const OperatingHoursTab = ({ operatingHours }: { operatingHours: OperatingHourType[] }) => {
    const formattedHours = formatOperatingHours(operatingHours);
    const currentStatus = getCurrentDayStatus(operatingHours);
    const today = new Date().getDay();

    return (
        <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Status Sekarang</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={currentStatus.isOpen ? "default" : "secondary"}
                        className={`${currentStatus.isOpen ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500 text-white"}`}
                    >
                        {currentStatus.isOpen ? "Buka" : "Tutup"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{currentStatus.message}</span>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Jam Operasional</h3>
                <div className="space-y-2">
                    {formattedHours.map((hour) => (
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
                                        Hari ini
                                    </Badge>
                                )}
                            </div>
                            <div className="text-right">
                                {hour.isOpen ? (
                                    <span className="text-sm text-foreground">
                                        {hour.formattedOpenTime} - {hour.formattedCloseTime}
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Tutup</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function OutletContent({ outletId }: { outletId: string }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { updateAppbar } = useAppBar();
    const t = useTranslations('outletDetail');

    const results = useQueries({
        queries: [
            {
                queryKey: ["outlet", outletId],
                queryFn: () => Outlet.getDetail(outletId)
            },
            {
                queryKey: ["products", outletId],
                queryFn: () => Product.getAllByOutlet(outletId)
            }
        ],
    });

    const [outletQuery, productQuery] = results;

    const services = useMemo(() => productQuery.data?.filter(p => p.type === "SERVICE") ?? [], [productQuery.data]);
    const goods = useMemo(() => productQuery.data?.filter(p => p.type === "GOODS") ?? [], [productQuery.data]);
    const isOutletFavorite = outletQuery.data ? isFavorite(outletQuery.data.id) : false;

    const handleToggleFavorite = useCallback(() => {
        if (!outletQuery.data) return;
        const outlet = outletQuery.data;
        toggleFavorite({
            id: outlet.id,
            name: outlet.name,
            address: outlet.address,
            image: outlet.image || undefined,
            isOpen: outlet.isOpen,
        });
    }, [toggleFavorite, outletQuery.data?.id, outletQuery.data?.name, outletQuery.data?.address, outletQuery.data?.image, outletQuery.data?.isOpen]);

    const handleWhatsAppChat = useCallback(() => {
        if (!outletQuery.data?.phone) return;
        const outlet = outletQuery.data;
        const message = encodeURIComponent(`Halo, saya tertarik dengan outlet ${outlet.name}`);
        const whatsappUrl = `https://wa.me/${(outlet.phone?.startsWith("+62") ? outlet.phone : "+62" + outlet.phone.slice(1)).replace(/\D/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }, [outletQuery.data?.phone, outletQuery.data?.name]);

    const lastOutletRef = useRef<string>('');
    const lastFavoriteState = useRef<boolean>(false);

    useEffect(() => {
        const currentOutletId = outletQuery.data?.id || '';

        if (lastOutletRef.current === currentOutletId &&
            lastFavoriteState.current === isOutletFavorite &&
            currentOutletId !== '') {
            return;
        }

        lastOutletRef.current = currentOutletId;
        lastFavoriteState.current = isOutletFavorite;

        if (!outletQuery.data) {
            updateAppbar({
                title: "Outlet",
                sticky: true,
                showSearch: false,
                centerTitle: true,
                rightContent: null
            });
            return;
        }

        const outlet = outletQuery.data;
        updateAppbar({
            title: "Outlet",
            sticky: true,
            subtitle: outlet.name,
            showSearch: false,
            centerTitle: true,
            rightContent: (
                <>
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
            )
        });
    }, [outletQuery.data?.id, outletQuery.data?.name, isOutletFavorite, handleToggleFavorite]);

    if (outletQuery.isLoading) {
        return <LoadingState />;
    }

    if (outletQuery.isError) {
        return <ErrorState />;
    }

    if (!outletQuery.data) {
        return <EmptyState title="Outlet tidak ditemukan" />;
    }

    const outlet = outletQuery.data!

    return (
        <div className="pb-20">
            <div className="relative h-52 bg-muted -mx-4 -mt-4">
                {outlet.image ? (
                    <ImageRender
                        src={outlet.image}
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
                            variant={outlet.isOpen ? "default" : "secondary"}
                            className={`${outlet.isOpen ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500 text-white"}`}
                        >
                            {outlet.isOpen ? "Buka Sekarang" : "Tutup"}
                        </Badge>
                    </div>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-1 items-center text-white/90 text-sm mb-3"
                    >
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs truncate">{outlet.address}</span>
                    </a>
                    {outlet.phone && (
                        <div onClick={handleWhatsAppChat} className="flex cursor-pointer items-center gap-1 text-white/80 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{outlet.phone}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3 mt-6">
                <Tabs defaultValue="products" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-12">
                        <TabsTrigger value="products" className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Produk ({goods.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Layanan ({services.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="hours" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Jam Buka</span>
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
                                title="Tidak Ada Produk"
                                description="Outlet ini belum menyediakan produk" />
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
                                title="Tidak ada layanan"
                                description="Outlet ini belum menyediakan layanan."
                                icon={<Wrench className="text-muted-foreground" />}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="hours" className="mt-2 space-y-4">
                        {outlet.operatingHours && outlet.operatingHours.length > 0 ? (
                            <OperatingHoursTab operatingHours={outlet.operatingHours} />
                        ) : (
                            <EmptyState
                                title="Jam operasional tidak tersedia"
                                description="Informasi jam buka outlet ini belum tersedia."
                                icon={<Clock className="text-muted-foreground" />}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}