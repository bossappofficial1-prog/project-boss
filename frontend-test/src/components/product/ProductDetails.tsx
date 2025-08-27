'use client'

import React, { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product as ProductService } from "@/services/product";
import { Outlet as OutletService } from "@/services/outlets";
import { useAppBar } from "@/context/AppBarContext";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageRender } from "@/components/shared/Image";
import { LoadingState, ErrorState, EmptyState } from "@/components/Base";
import { Heart, ShoppingCart, ArrowLeft, Clock, MapPin, Share2, Tag, Layers, CheckCircle, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShareOutlet } from "@/components/shared/ShareOutlet";
import { ProductType } from "@/types";
import { ScheduleModal } from "../outlet/ScheduleModal";

type Props = {
    params: Promise<{ id: string; productId: string }>;
};

export function ProductDetails({ params }: Props) {
    const router = useRouter();
    const { updateAppbar } = useAppBar();
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false)

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
    const isProductFavorite = product ? isFavorite(product.id) : false;

    const handleToggleFavorite = useCallback(() => {
        if (!product || !outlet) return;
        toggleFavorite({
            id: product.id,
            name: product.name,
            address: outlet.address,
            image: product.image || undefined,
            isOpen: outlet.isOpen,
        });
    }, [product, outlet, toggleFavorite]);

    const handleAddToCart = useCallback(() => {
        if (!product || !outlet) return;
        addItem(outlet.id, outlet.name, product, 1);
    }, [product, outlet, addItem]);

    useEffect(() => {
        updateAppbar({
            title: "Detail Produk",
            subtitle: product?.name || "Memuat...",
            centerTitle: true,
            sticky: false,
            rightContent: (
                <ShareOutlet outlet={{ id: outlet?.id ?? '', name: product?.name ?? '', address: outlet?.address ?? '', image: product?.image }}>
                    <Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button>
                </ShareOutlet>
            )
        });
    }, [product, outlet, updateAppbar, router]);

    if (productQuery.isLoading || outletQuery.isLoading) return <LoadingState />;
    if (productQuery.isError || outletQuery.isError) return <ErrorState onRetry={() => router.refresh()} />;
    if (!product || !outlet) return <EmptyState title="Produk tidak ditemukan" />;

    const productDetailsList = [
        { icon: Layers, label: "Kategori", value: product.unit || "Umum" },
        { icon: Tag, label: "Tipe", value: product.type === "GOODS" ? "Produk" : "Layanan" },
        product.serviceDurationMinutes && { icon: Clock, label: "Durasi", value: `${product.serviceDurationMinutes} menit` },
        {
            icon: CheckCircle,
            label: "Status",
            value: (
                <Badge variant={product.status === "ACTIVE" ? "default" : "destructive"}>
                    {product.status === "ACTIVE" ? "Tersedia" : "Habis"}
                </Badge>
            )
        }
    ].filter(Boolean);

    return (
        <>
            {/* Hero Image */}
            <div className="relative h-64 bg-muted -mx-4 -mt-4">
                {product.image ? (
                    <ImageRender
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <Store className="w-20 h-20 text-primary/40" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Konten Utama */}
            <div className="p-5 space-y-6 -mt-16 relative bg-background rounded-t-3xl shadow-2xl pb-40">
                <div className="space-y-2">
                    <Badge variant="outline" className="font-semibold rounded-lg">{product.type === "GOODS" ? "Produk" : "Layanan"}</Badge>
                    <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                    <p className="text-3xl font-bold text-destructive">
                        {formatCurrency(product.price)}
                    </p>
                </div>

                {/* Info Outlet Card */}
                <div className="p-4 rounded-xl border bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Tersedia di</p>
                    <Link href={`/outlet/${outlet.id}`} className="flex items-center justify-between gap-3 group">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold group-hover:text-primary transition-colors truncate">{outlet.name}</h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{outlet.address}</span>
                            </div>
                        </div>
                        {/* <Badge variant={outlet.isOpen ? "default" : "secondary"}>
                            {outlet.isOpen ? "Buka" : "Tutup"}
                        </Badge> */}
                    </Link>
                </div>

                {/* Deskripsi */}
                {product.description && (
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold">Deskripsi Produk</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* Detail */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Detail</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        {productDetailsList.map((item, index) => item && (
                            <div key={index} className="flex items-start gap-3">
                                <item.icon className="w-5 h-5 mt-0.5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                    <p className="font-medium">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/90 backdrop-blur-sm border-t">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Button variant="outline" size="lg" onClick={handleToggleFavorite}>
                        <Heart className={`w-6 h-6 transition-all ${isProductFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>

                    {product.type === "GOODS" && (
                        <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.status !== "ACTIVE" || !outlet.isOpen}>
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Tambah Keranjang
                        </Button>
                    )}

                    {product.type === "SERVICE" && (
                        <Button size="lg" className="flex-1" onClick={() => { setShowScheduleModal(!showScheduleModal) }} disabled={product.status !== "ACTIVE" || !outlet.isOpen}>
                            <Clock className="w-5 h-5 mr-2" />
                            Booking Layanan
                        </Button>
                    )}
                </div>
            </div>

            {product.type === "SERVICE" && showScheduleModal && <ScheduleModal
                key={outletId + productId}
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(!showScheduleModal)}
                onSelectSchedule={(schedule) => { addItem(outletId, outlet.name, product, 1, schedule) }}
                product={product}
                outletId={outletId}
            />}
        </>
    );
}