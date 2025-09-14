'use client'

import React, { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product as ProductService } from "@/services/product";
import { Outlet as OutletService } from "@/services/outlets";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedProducts } from "@/hooks/useSavedProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageRender } from "@/components/shared/Image";
import { LoadingState, ErrorState, EmptyState } from "@/components/Base";
import { Heart, ShoppingCart, ArrowLeft, Clock, MapPin, Share2, Tag, Layers, CheckCircle, Store, Bookmark } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductType } from "@/types";
import { ScheduleModal } from "../outlet/ScheduleModal";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "@/hooks/useI18n";
import { ProductImagesSlider } from "../shared/ProductImagesSlider";

type Props = {
    params: Promise<{ id: string; productId: string }>;
};

export function ProductDetails({ params }: Props) {
    const router = useRouter();
    const { addItem } = useCart();
    const { push: toast } = useToast();
    const { setAppBar, resetAppBar } = useAppBarV2()
    const { isProductSaved, toggleSaveProduct } = useSavedProducts();
    const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false)
    const t = useTranslations("productDetails");
    const tCommon = useTranslations("common");
    const from = useSearchParams().get("from")

    const [outletId, setOutletId] = useState<string>('');
    const [productId, setProductId] = useState<string>('');

    useEffect(() => {
        params.then(({ id, productId }) => {
            setOutletId(id);
            setProductId(productId);
        });
    }, [params]);

    const productQuery = useQuery<ProductType>({
        queryKey: ["product", outletId, productId],
        queryFn: () => ProductService.getDetail(productId),
        enabled: !!(outletId && productId)
    });

    const outletQuery = useQuery({
        queryKey: ["outlet", outletId],
        queryFn: () => OutletService.getDetail(outletId),
        enabled: !!outletId
    });

    const product = productQuery.data;
    const outlet = outletQuery.data;
    const isProductInSaved = product ? isProductSaved(product.id) : false;

    useEffect(() => {
        if (!product) return;
        setAppBar({
            title: t("title"),
            subtitle: product?.name,
            centerTitle: true,
            showBackButton: true,
            ...(from && from === "saved-products" ? {
                onLeftClick() {
                    router.back()
                },
            } : {
                onLeftClick() {
                    router.push(`/outlet/${outletId}?from=product`)
                },
            }),
            rightContent: (
                <button
                    onClick={() => {
                        navigator.share?.({
                            title: product.name,
                            text: t("shareText", {
                                type: t(`shareType.${product.type}`),
                                name: product.name
                            }),
                            url: window.location.href,
                        }).catch(err => console.error('Error sharing', err));
                    }}
                    className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full backdrop-blur-sm z-10 transition-all hover:bg-black/40"
                    aria-label="Share product"
                >
                    <Share2 size={20} />
                </button>
            )
        })
        return () => resetAppBar()
    }, [product, outletId, router, setAppBar, resetAppBar, t]);

    const handleToggleSaveProduct = useCallback(() => {
        if (!product) return;
        toggleSaveProduct(product.id);
    }, [product, toggleSaveProduct]);

    const handleAddToCart = useCallback(() => {
        if (!product || !outlet) return;
        try {
            addItem(outlet.id, outlet.name, product, 1);
        } catch (error) {
            toast({
                title: t("toast.addProductError"),
                description: t("toast.addProductErrorDesc")
            });
        }
    }, [product, outlet, addItem, toast, t]);

    const handleScheduleSelect = useCallback((schedule: any) => {
        if (!outlet || !product) return;
        try {
            addItem(outletId, outlet.name, product, 1, schedule);
            setShowScheduleModal(false);
        } catch (error) {
            toast({
                title: t("toast.addServiceError"),
                description: t("toast.addServiceErrorDesc")
            });
        }
    }, [outletId, outlet, product, addItem, toast, t]);

    const formatDescription = (description: string) => {
        if (!description) return '';
        return description.split('\n').map(line => line.trim().startsWith('- ') ? `• ${line.trim().substring(2)}` : line).join('\n');
    };

    if (productQuery.isLoading || outletQuery.isLoading) return <LoadingState />;
    if (productQuery.isError || outletQuery.isError) return <ErrorState onRetry={() => router.refresh()} />;
    if (!product || !outlet) return <EmptyState title={t("empty.title")} />;

    const productDetailsList = [
        { icon: Layers, label: t("labels.category"), value: product.unit || t("labels.general") },
        { icon: Tag, label: t("labels.type"), value: product.type === "GOODS" ? t("labels.product") : t("labels.service") },
        product.serviceDurationMinutes && { icon: Clock, label: t("labels.duration"), value: `${product.serviceDurationMinutes} ${t("labels.minutes")}` },
    ].filter(Boolean);

    return (
        <div className="pb-16">
            {/* Hero Image */}
            <div className="relative h-72 bg-muted -mx-4 -mt-4">
                {product.images && product.images.length > 1 ? (
                    <ProductImagesSlider
                        aspectRatio="16/9"
                        showControls={true}
                        autoPlay
                        images={product.images.map((img) => ({ url: img.url, alt: img.alt }))}
                    />
                ) : product.images && product.images.length === 1 ? (
                    <div className="relative w-full h-full">
                        <ImageRender src={product.images[0].url} alt={product.name} className="object-cover w-full h-full" priority />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                    </div>
                ) : product.image ? (
                    <div className="relative w-full h-full">
                        <ImageRender src={product.image} alt={product.name} className="object-cover w-full h-full" priority />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <Store className="w-20 h-20 text-primary/40" />
                    </div>
                )}
            </div>

            {/* Konten Utama dengan efek "sheet" */}
            <div className="p-5 space-y-6 -mt-16 relative z-40 bg-background rounded-t-md shadow-lg">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 rounded-full mt-3" />

                <div className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-medium rounded-full px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                            {product.type === "GOODS" ? t("labels.product") : t("labels.service")}
                        </Badge>
                        <Badge variant={outlet.isOpen ? "default" : "secondary"} className={cn("rounded-full px-3 flex items-center gap-1.5", outlet.isOpen ? "bg-green-100 text-green-700 hover:bg-green-200" : "")}>
                            <span className={cn("w-2 h-2 rounded-full", outlet.isOpen ? "bg-green-500 animate-pulse" : "bg-gray-400")}></span>
                            {outlet.isOpen ? tCommon("open") : tCommon("closed")}
                        </Badge>
                        <Badge variant={product.status === "ACTIVE" ? "outline" : "destructive"} className={cn("font-medium", product.status === "ACTIVE" ? "bg-green-50 text-green-600 border-green-200" : "")}>
                            {product.status === "ACTIVE" ? t("labels.available") : t("labels.outOfStock")}
                        </Badge>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

                    <p className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-primary">
                            {formatCurrency(product.price)}
                        </span>
                        {product.unit && <span className="text-base text-muted-foreground">/ {product.unit}</span>}
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-muted hover:border-primary/20 bg-card/50 transition-all duration-200 hover:shadow-sm">
                    <Link href={`/outlet/${outlet.id}`} className="block">
                        <div className="flex items-center gap-2 mb-2">
                            <Store className="w-3.5 h-3.5 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">{t("labels.availableAt")}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{outlet.name}</h3>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{outlet.address}</span>
                                </div>
                            </div>
                            <div className="bg-primary/10 p-1.5 rounded-full">
                                <ArrowLeft size={16} className="text-primary rotate-180" />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {productDetailsList.map((item, index) => item && (
                        <div key={index} className="p-3 rounded-xl border bg-card/50 flex items-center gap-3 hover:border-primary/20 hover:shadow-sm transition-all">
                            <div className="p-2.5 rounded-lg bg-primary/10">
                                <item.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <div className="font-semibold text-sm mt-0.5">{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {product.description && (
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-1 rounded-full bg-primary"></div>
                            <h2 className="text-lg font-semibold">{t("labels.description", { type: product.type === "GOODS" ? t("labels.product") : t("labels.service") })}</h2>
                        </div>
                        <div className="p-4 rounded-xl border border-muted bg-card/30">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {formatDescription(product.description)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-3 z-[101] bg-background/90 backdrop-blur-lg border-t shadow-lg-top">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <div className="flex flex-col items-start flex-shrink-0 mr-2">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="font-bold text-lg text-primary -mt-0.5">{formatCurrency(product.price)}</span>
                    </div>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-muted" onClick={handleToggleSaveProduct}>
                        <Bookmark className={`w-6 h-6 transition-all duration-300 ${isProductInSaved ? 'fill-blue-500 text-blue-500 scale-110' : ''}`} />
                    </Button>
                    {product.type === "GOODS" && (
                        <Button size="lg" className="flex-1 h-12 rounded-xl" onClick={handleAddToCart} disabled={product.status !== "ACTIVE" || !outlet.isOpen}>
                            <ShoppingCart className="w-5 h-5 mr-2" /> {t("buttons.addToCart")}
                        </Button>
                    )}
                    {product.type === "SERVICE" && (
                        <Button size="lg" className="flex-1 h-12 rounded-xl" onClick={() => setShowScheduleModal(true)} disabled={product.status !== "ACTIVE" || !outlet.isOpen}>
                            <Clock className="w-5 h-5 mr-2" /> {t("buttons.bookService")}
                        </Button>
                    )}
                </div>
            </div>

            {product.type === "SERVICE" && showScheduleModal && <ScheduleModal key={outletId + productId} isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSelectSchedule={handleScheduleSelect} product={product} outletId={outletId} />}
        </div>
    );
}