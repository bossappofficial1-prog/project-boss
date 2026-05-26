"use client";

import { useEffect, useState, useRef } from "react";
import { Product as ProductService } from "@/services/product";
import { useSavedProducts } from "@/hooks/useSavedProducts";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useTranslations } from "@/hooks/useI18n";
import { useRouter } from "next/navigation";
import { SavedProductCard } from "@/components/product/SavedProductCard";
import { ErrorState, ConfirmationModal } from "@/components/Base";
import { Bookmark, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingState } from "@/components/base/LoadingState";

export default function SavedProductsPage() {
  const router = useRouter();
  const { setAppBar, resetAppBar } = useAppBarV2();
  const { savedProductIds, unsaveProduct, clearSavedProducts, isLoaded } =
    useSavedProducts();

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
    productName: "",
  });

  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const fetchedIdsRef = useRef<string>("");

  // Sync native app bar header
  useEffect(() => {
    setAppBar({
      title: t("title"),
      subtitle:
        savedProducts.length > 0
          ? `${savedProducts.length} Produk Disimpan`
          : t("subtitle"),
      centerTitle: true,
      showBackButton: true,
      showPartnerToggle: false,
      onLeftClick: () => router.back(),
    });

    return () => resetAppBar();
  }, [setAppBar, resetAppBar, router, t, savedProducts.length]);

  // Fetch saved products from backend
  useEffect(() => {
    const fetchSavedProducts = async () => {
      if (!isLoaded) return;

      const currentIdsKey = savedProductIds.slice().sort().join(",");

      if (savedProductIds.length === 0) {
        setSavedProducts([]);
        fetchedIdsRef.current = "";
        return;
      }

      if (currentIdsKey === fetchedIdsRef.current) {
        return;
      }

      setLoading(true);
      setError(null);
      fetchedIdsRef.current = currentIdsKey;

      try {
        const productPromises = savedProductIds.map((id) =>
          ProductService.getDetail(id).catch(() => null),
        );

        const results = await Promise.all(productPromises);
        const validProducts = results.filter(
          (product): product is ProductType => product !== null,
        );

        setSavedProducts(validProducts);

        const validProductIds = validProducts.map((p) => p.id);
        const invalidIds = savedProductIds.filter(
          (id) => !validProductIds.includes(id),
        );

        if (invalidIds.length > 0) {
          invalidIds.forEach((id) => unsaveProduct(id));
        }
      } catch (err) {
        console.error("Error fetching saved products:", err);
        setError(t("error.fetchError"));
        fetchedIdsRef.current = "";
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProducts();
  }, [savedProductIds, unsaveProduct, t, isLoaded]);

  const handleProductClick = (product: ProductType) => {
    router.push(
      `/outlet/${product.outletId}/product/${product.id}?from=saved-products`,
    );
  };

  const handleRemoveProduct = (productId: string) => {
    const product = savedProducts.find((p) => p.id === productId);
    setDeleteConfirmation({
      isOpen: true,
      productId: productId,
      productName: product?.name || "produk ini",
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation.productId) return;

    const productId = deleteConfirmation.productId;
    setSavedProducts((prev) => prev.filter((p) => p.id !== productId));
    unsaveProduct(productId);

    const updatedIds = savedProductIds
      .filter((id) => id !== productId)
      .sort()
      .join(",");
    fetchedIdsRef.current = updatedIds;

    setDeleteConfirmation({
      isOpen: false,
      productId: null,
      productName: "",
    });
  };

  const handleClearAll = () => {
    setClearConfirmationOpen(true);
  };

  const confirmClearAll = () => {
    setSavedProducts([]);
    clearSavedProducts();
    fetchedIdsRef.current = "";
    setClearConfirmationOpen(false);
  };

  if (!isLoaded || (loading && savedProducts.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <LoadingState message="Memuat produk disimpan..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState onRetry={() => window.location.reload()} message={error} />
    );
  }

  // A. Premium Bookmark Empty State
  if (savedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="space-y-6 max-w-sm mx-auto flex flex-col items-center"
        >
          {/* Floating Bookmark Illustration */}
          <div className="relative">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center shadow-inner relative z-10"
            >
              <Bookmark className="w-9 h-9 text-primary fill-current" />
            </motion.div>
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-110 z-0 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {t("empty.title")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("empty.description")}
            </p>
          </div>

          <motion.div whileTap={{ scale: 0.95 }} className="w-full pt-4">
            <Button
              onClick={() => router.push("/")}
              className="w-full h-11 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/95 text-white"
            >
              {t("empty.action")}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24 px-1 pt-1 max-w-4xl mx-auto">
      {/* 1. Header results count & clear all trigger */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 px-1">
        <span className="font-semibold text-muted-foreground/80">
          {t("foundProducts", { count: savedProducts.length })}
        </span>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold tracking-tight transition-colors"
            onClick={handleClearAll}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Hapus Semua</span>
          </Button>
        </motion.div>
      </div>

      {/* 2. Scrollable Cards List with Framer Motion slide-away rearrange */}
      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {savedProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 35,
              }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              {/* Existing Card component reused perfectly */}
              <SavedProductCard
                product={product}
                onClick={() => handleProductClick(product)}
              />

              {/* Redesigned Glassmorphism Save/Bookmark Button */}
              <motion.div
                whileTap={{ scale: 0.8 }}
                className="absolute top-2.5 right-2.5 z-10"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full border border-border/30 bg-background/85 backdrop-blur-md text-rose-500 hover:text-rose-600 hover:bg-rose-50 shadow-sm flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveProduct(product.id);
                  }}
                  title={t("removeFromSaved")}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. Single delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({
            isOpen: false,
            productId: null,
            productName: "",
          })
        }
        onConfirm={confirmDelete}
        title={t("deleteConfirmation.title")}
        message={t("deleteConfirmation.message", {
          productName: deleteConfirmation.productName,
        })}
        confirmText={t("deleteConfirmation.confirm")}
        cancelText={t("deleteConfirmation.cancel")}
        variant="destructive"
      />

      {/* 4. Clear all confirmation modal */}
      <Dialog
        open={clearConfirmationOpen}
        onOpenChange={setClearConfirmationOpen}
      >
        <DialogContent className="sm:max-w-sm rounded-xl border border-border/40 p-5 shadow-2xl">
          <div className="space-y-2 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold tracking-tight">
              Hapus Semua Simpanan?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tindakan ini akan menghapus semua produk dari daftar simpanan
              Anda.
            </p>
          </div>
          <div className="flex flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs font-semibold rounded-lg"
              onClick={() => setClearConfirmationOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              onClick={confirmClearAll}
            >
              Hapus Semua
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
