"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { Product as ProductService } from "@/services/product";
import { Outlet as OutletService } from "@/services/outlets";
import { useCart } from "@/hooks/useCart";
import { useSavedProducts } from "@/hooks/useSavedProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageRender } from "@/components/shared/Image";
import { LoadingState, ErrorState, EmptyState } from "@/components/Base";
import { EmptyStates } from "@/components/base/EmptyStates";
import {
  ShoppingCart,
  ArrowLeft,
  Clock,
  MapPin,
  Share2,
  Tag,
  Layers,
  Store,
  Bookmark,
  ChevronRight,
  Package,
  Wrench,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types/product";
import { OutletType } from "@/types";
import { ScheduleModal } from "../outlet/ScheduleModal";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { Messages, NestedKeyOf, useTranslations } from "@/hooks/useI18n";
import { ProductImagesSlider } from "../shared/ProductImagesSlider";
import { useSnackbar } from "@/hooks/useSnackbar";
import { getProductPrice, getProductUnit, getServiceDuration } from "@/lib/utils/product";

type Props = {
  outletId: string;
  productId: string;
};

export function ProductDetails({ outletId, productId }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const snackbar = useSnackbar();
  const { setAppBar, resetAppBar } = useAppBarV2();
  const { isProductSaved, toggleSaveProduct } = useSavedProducts();

  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const t = useTranslations("productDetails");
  const tCommon = useTranslations("common");
  const from = useSearchParams().get("from");

  // Query product dan outlet
  const productQuery = useQuery<Product>({
    queryKey: ["product", outletId, productId],
    queryFn: () => ProductService.getDetail(productId),
    enabled: Boolean(outletId && productId),
    retry: false,
  });

  const outletQuery = useQuery<OutletType>({
    queryKey: ["outlet", outletId],
    queryFn: () => OutletService.getDetail(outletId),
    enabled: Boolean(outletId),
    retry: false,
  });

  const product = productQuery.data;
  const outlet = outletQuery.data;

  const productErrorStatus = (productQuery.error as AxiosError | undefined)?.response?.status;
  const outletErrorStatus = (outletQuery.error as AxiosError | undefined)?.response?.status;

  const isProductInSaved = useMemo(
    () => (product ? isProductSaved(product.id) : false),
    [product, isProductSaved],
  );

  // Setup AppBar
  useEffect(() => {
    if (!product) return;

    setAppBar({
      title: t("title"),
      subtitle: product.name,
      centerTitle: true,
      showBackButton: true,
      showThemeToggle: false,
      showPartnerToggle: false,
      onLeftClick:
        (from === "saved-products" || from === "home")
          ? () => router.back()
          : () => router.push(`/outlet/${outletId}?from=product`),
      rightContent: (
        <button
          onClick={() =>
            navigator.share?.({
              title: product.name,
              text: t("shareText", {
                type: t(`shareType.${product.type}`),
                name: product.name,
              }),
              url: window.location.href,
            })
          }
          className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full backdrop-blur-sm z-10 transition-all hover:bg-black/40"
          aria-label="Share product">
          <Share2 size={20} />
        </button>
      ),
    });

    return () => resetAppBar();
  }, [product, outletId, from, router, setAppBar, resetAppBar, t]);

  // Action Handlers
  const handleToggleSaveProduct = useCallback(() => {
    if (product) toggleSaveProduct(product.id);
  }, [product, toggleSaveProduct]);

  const handleAddToCart = useCallback(() => {
    if (!product || !outlet) return;
    try {
      addItem(outlet.id, outlet.name, product, 1);
    } catch {
      snackbar.error(t("toast.addProductError"));
    }
  }, [product, outlet, addItem, t, snackbar]);

  const handleScheduleSelect = useCallback(
    (schedule: any) => {
      if (!outlet || !product) return;
      try {
        addItem(outletId, outlet.name, product, 1, schedule);
        setShowScheduleModal(false);
      } catch {
        snackbar.error(t("toast.addServiceErrorDesc"));
      }
    },
    [outletId, outlet, product, addItem, t, snackbar],
  );

  // Format Deskripsi
  const formattedDescription = useMemo(() => {
    if (!product?.description) return "";
    return product.description
      .split("\n")
      .map((line: string) =>
        line.trim().startsWith("- ") ? `• ${line.trim().substring(2)}` : line,
      )
      .join("\n");
  }, [product?.description]);

  // Detail List
  const productDetailsList: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }> = useMemo(
    () =>
      [
        {
          icon: Layers,
          label: t("labels.category"),
          value: product ? getProductUnit(product) || t("labels.general") : t("labels.general"),
        },
        {
          icon: Tag,
          label: t("labels.type"),
          value: product?.type === "GOODS" ? t("labels.product") : t("labels.service"),
        },
        product &&
        getServiceDuration(product) && {
          icon: Clock,
          label: t("labels.duration"),
          value: `${getServiceDuration(product)} ${t("labels.minutes")}`,
        },
      ].filter(Boolean) as Array<{
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        value: string;
      }>,
    [product, t],
  );

  // Loading & Error State
  if (productQuery.isLoading || outletQuery.isLoading) {
    return <LoadingState />;
  }

  if (productErrorStatus === 404 || outletErrorStatus === 404) {
    return (
      <EmptyStates.NotFound
        action={{
          label: "Back to Home",
          onClick: () => router.push("/"),
        }}
      />
    );
  }

  if (productQuery.isError || outletQuery.isError) {
    return <ErrorState onRetry={() => router.refresh()} />;
  }

  if (!product || !outlet) {
    return <EmptyState title={t("empty.title")} />;
  }

  return (
    <div className="pb-24">
      <HeroImage product={product} />

      {/* Content Sheet */}
      <div className="relative z-40 -mt-8 rounded-t-2xl bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-5 pb-6 space-y-5">
          <HeaderSection product={product} outlet={outlet} t={t} tCommon={tCommon} />

          {/* Detail chips */}
          <div className="flex flex-wrap gap-2">
            {productDetailsList.map((item, index) => (
              <DetailChip key={index} icon={item.icon} label={item.label} value={item.value} />
            ))}
          </div>

          <OutletCard outlet={outlet} t={t} />

          {formattedDescription && (
            <DescriptionSection description={formattedDescription} productType={product.type} t={t} />
          )}
        </div>
      </div>

      <BottomActions
        product={product}
        outlet={outlet}
        isProductInSaved={isProductInSaved}
        onSave={handleToggleSaveProduct}
        onAddToCart={handleAddToCart}
        onOpenSchedule={() => setShowScheduleModal(true)}
        t={t}
      />

      {product.type === "SERVICE" && showScheduleModal && (
        <ScheduleModal
          key={outletId + productId}
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSelectSchedule={handleScheduleSelect}
          product={product}
          outletId={outletId}
        />
      )}
    </div>
  );
}

type HeroImageProps = {
  product: Product;
};

const HeroImage: React.FC<HeroImageProps> = ({ product }) => {
  if (product.images && product.images.length > 1) {
    return (
      <div className="relative h-72 sm:h-80 bg-muted -mx-4 -mt-4 overflow-hidden">
        <ProductImagesSlider
          aspectRatio="16/9"
          showControls
          autoPlay
          images={product.images.map((img) => ({
            url: img.url,
            alt: img.alt,
          }))}
        />
      </div>
    );
  }

  const imageUrl = product.images?.[0]?.url || product.image;
  if (imageUrl) {
    return (
      <div className="relative h-72 sm:h-80 bg-muted -mx-4 -mt-4 overflow-hidden">
        <ImageRender
          src={imageUrl}
          alt={product.name}
          className="object-cover w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-72 sm:h-80 flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/15 to-primary/25 -mx-4 -mt-4">
      {product.type === "GOODS" ? (
        <Package className="w-16 h-16 text-primary/30" />
      ) : (
        <Wrench className="w-16 h-16 text-primary/30" />
      )}
    </div>
  );
};

type HeaderSectionProps = {
  product: Product;
  outlet: OutletType;
  t: (
    key: NestedKeyOf<Messages["productDetails"]>,
    values?: Record<string, string | number>,
  ) => string;
  tCommon: (key: NestedKeyOf<Messages["common"]>) => string;
};
const HeaderSection: React.FC<HeaderSectionProps> = ({ product, outlet, t, tCommon }) => (
  <div className="space-y-3">
    {/* Badges row */}
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge
        variant="outline"
        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-primary/20 bg-primary/5 text-primary">
        {product.type === "GOODS" ? t("labels.product") : t("labels.service")}
      </Badge>
      <Badge
        variant={outlet.isOpen ? "default" : "secondary"}
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1",
          outlet.isOpen
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-500",
        )}>
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            outlet.isOpen ? "bg-green-500" : "bg-gray-400",
          )}
        />
        {outlet.isOpen ? tCommon("open") : tCommon("closed")}
      </Badge>
      {product.status !== "ACTIVE" && (
        <Badge
          variant="destructive"
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
          {t("labels.outOfStock")}
        </Badge>
      )}
    </div>

    {/* Product name */}
    <h1 className="text-2xl font-bold tracking-tight leading-tight">{product.name}</h1>

    {/* Price */}
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-extrabold text-primary tabular-nums">
        {formatCurrency(getProductPrice(product))}
      </span>
      {getProductUnit(product) && (
        <span className="text-sm text-muted-foreground font-medium">/ {getProductUnit(product)}</span>
      )}
    </div>
  </div>
);

type OutletCardProps = {
  outlet: OutletType;
  t: (
    key: NestedKeyOf<Messages["productDetails"]>,
    values?: Record<string, string | number>,
  ) => string;
};
const OutletCard: React.FC<OutletCardProps> = ({ outlet, t }) => (
  <Link
    href={`/outlet/${outlet.id}`}
    className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/20 transition-all duration-200 group">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Store className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("labels.availableAt")}</p>
      <h3 className="text-sm font-semibold truncate mt-0.5">{outlet.name}</h3>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{outlet.address}</span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
  </Link>
);

type DetailChipProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};
const DetailChip: React.FC<DetailChipProps> = ({ icon: Icon, label, value }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5">
    <Icon className="w-3.5 h-3.5 text-primary" />
    <span className="text-xs text-muted-foreground">{label}:</span>
    <span className="text-xs font-semibold">{value}</span>
  </div>
);

type DescriptionSectionProps = {
  description: string;
  productType: Product["type"];
  t: (
    key: NestedKeyOf<Messages["productDetails"]>,
    values?: Record<string, string | number>,
  ) => string;
};
const DescriptionSection: React.FC<DescriptionSectionProps> = ({ description, productType, t }) => (
  <div>
    <h2 className="text-sm font-semibold text-muted-foreground mb-2">
      {t("labels.description", {
        type: productType === "GOODS" ? t("labels.product") : t("labels.service"),
      })}
    </h2>
    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
      {description}
    </p>
  </div>
);

type BottomActionsProps = {
  product: Product;
  outlet: OutletType;
  isProductInSaved: boolean;
  onSave: () => void;
  onAddToCart: () => void;
  onOpenSchedule: () => void;
  t: (
    key: NestedKeyOf<Messages["productDetails"]>,
    values?: Record<string, string | number>,
  ) => string;
};
const BottomActions: React.FC<BottomActionsProps> = ({
  product,
  outlet,
  isProductInSaved,
  onSave,
  onAddToCart,
  onOpenSchedule,
  t,
}) => (
  <div className="fixed bottom-0 left-0 right-0 z-[101] bg-background/95 backdrop-blur-xl border-t border-border/50">
    <div className="max-w-md mx-auto flex items-center gap-2.5 px-4 py-3">
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full border-border/60 flex-shrink-0 hover:bg-muted/80"
        onClick={onSave}>
        <Bookmark
          className={cn(
            "w-5 h-5 transition-all duration-300",
            isProductInSaved && "fill-blue-500 text-blue-500 scale-110",
          )}
        />
      </Button>

      {product.type === "GOODS" && (
        <Button
          size="lg"
          className="flex-1 h-11 rounded-full font-semibold text-sm shadow-sm gap-2"
          onClick={onAddToCart}
          disabled={product.status !== "ACTIVE" || !outlet.isOpen}>
          <ShoppingCart className="w-4 h-4" /> {t("buttons.addToCart")}
        </Button>
      )}

      {product.type === "SERVICE" && (
        <Button
          size="lg"
          className="flex-1 h-11 rounded-full font-semibold text-sm shadow-sm gap-2"
          onClick={onOpenSchedule}
          disabled={product.status !== "ACTIVE" || !outlet.isOpen}>
          <Clock className="w-4 h-4" /> {t("buttons.bookService")}
        </Button>
      )}
    </div>
  </div>
);
