'use client'

import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product as ProductService } from "@/services/product";
import { useSavedProducts } from "@/hooks/useSavedProducts";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useTranslations } from "@/hooks/useI18n";
import { useRouter } from "next/navigation";
import { SavedProductCard } from "@/components/product/SavedProductCard";
import { LoadingState, ErrorState, EmptyState, ConfirmationModal } from "@/components/Base";
import { Bookmark, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductType } from "@/types";

export default function SavedProductsPage() {
    const router = useRouter();
    const { setAppBar, resetAppBar } = useAppBarV2();
    const { savedProductIds, unsaveProduct, isLoaded } = useSavedProducts();
    const t = useTranslations("savedProductsPage");

    const [savedProducts, setSavedProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        productId: string | null;
        productName: string;
    }>({
        isOpen: false,
        productId: null,
        productName: ''
    });
    const fetchedIdsRef = useRef<string>('');

    useEffect(() => {
        setAppBar({
            title: t("title"),
            subtitle: t("subtitle"),
            centerTitle: true,
            showBackButton: true,
            showPartnerToggle: false,
            onLeftClick: () => router.back()
        });

        return () => resetAppBar();
    }, [setAppBar, resetAppBar, router, t]);

    // Fetch saved products when savedProductIds changes
    useEffect(() => {
        const fetchSavedProducts = async () => {
            // Wait for hook to be loaded
            if (!isLoaded) return;

            // Create a unique key from sorted IDs to detect changes
            const currentIdsKey = savedProductIds.slice().sort().join(',');

            // If no IDs or same as previous fetch, don't proceed
            if (savedProductIds.length === 0) {
                setSavedProducts([]);
                fetchedIdsRef.current = '';
                return;
            }

            // If we already fetched these exact IDs, don't fetch again
            if (currentIdsKey === fetchedIdsRef.current) {
                return;
            }

            setLoading(true);
            setError(null);
            fetchedIdsRef.current = currentIdsKey;

            try {
                const productPromises = savedProductIds.map(id =>
                    ProductService.getDetail(id).catch(() => null)
                );

                const results = await Promise.all(productPromises);
                const validProducts = results.filter((product): product is ProductType => product !== null);

                setSavedProducts(validProducts);

                // Remove invalid product IDs from saved list
                const validProductIds = validProducts.map(p => p.id);
                const invalidIds = savedProductIds.filter(id => !validProductIds.includes(id));

                // Only remove invalid IDs if there are any (to avoid triggering another update)
                if (invalidIds.length > 0) {
                    invalidIds.forEach(id => unsaveProduct(id));
                }

            } catch (err) {
                console.error("Error fetching saved products:", err);
                setError(t("error.fetchError"));
                fetchedIdsRef.current = ''; // Reset on error to allow retry
            } finally {
                setLoading(false);
            }
        };

        fetchSavedProducts();
    }, [savedProductIds, unsaveProduct, t, isLoaded]); // Removed loading from dependencies

    const handleProductClick = (product: ProductType) => {
        router.push(`/outlet/${product.outletId}/product/${product.id}?from=saved-products`);
    };

    const handleRemoveProduct = (productId: string) => {
        const product = savedProducts.find(p => p.id === productId);
        setDeleteConfirmation({
            isOpen: true,
            productId: productId,
            productName: product?.name || 'produk ini'
        });
    };

    const confirmDelete = () => {
        if (!deleteConfirmation.productId) return;

        const productId = deleteConfirmation.productId;

        // Update local state immediately for better UX
        setSavedProducts(prev => prev.filter(p => p.id !== productId));

        // Remove from saved products (this will trigger useEffect but with different IDs)
        unsaveProduct(productId);

        // Update fetched IDs ref to reflect the removal
        const updatedIds = savedProductIds.filter(id => id !== productId).sort().join(',');
        fetchedIdsRef.current = updatedIds;

        // Close modal
        setDeleteConfirmation({
            isOpen: false,
            productId: null,
            productName: ''
        });
    };

    const cancelDelete = () => {
        setDeleteConfirmation({
            isOpen: false,
            productId: null,
            productName: ''
        });
    };

    if (!isLoaded || (loading && savedProducts.length === 0)) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <ErrorState
                onRetry={() => window.location.reload()}
                message={error}
            />
        );
    }

    if (savedProducts.length === 0) {
        return (
            <EmptyState
                icon={<Bookmark />}
                title={t("empty.title")}
                description={t("empty.description")}
                action={{
                    label: t("empty.action"),
                    onClick: () => router.push("/")
                }}
            />
        );
    }

    return (
        <div className="space-y-2 pb-6">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {t("foundProducts", { count: savedProducts.length })}
                </div>
                {savedProducts.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        {t("swipeHint")}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {savedProducts.map((product) => (
                    <div key={product.id} className="relative group">
                        <SavedProductCard
                            product={product}
                            onClick={() => handleProductClick(product)}
                        />

                        <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0 rounded-full shadow-lg backdrop-blur-sm touch-manipulation z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProduct(product.id);
                            }}
                            title={t("removeFromSaved")}
                        >
                            <X size={10} />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={t("deleteConfirmation.title")}
                message={t("deleteConfirmation.message", { productName: deleteConfirmation.productName })}
                confirmText={t("deleteConfirmation.confirm")}
                cancelText={t("deleteConfirmation.cancel")}
                variant="destructive"
            />
        </div>
    );
}