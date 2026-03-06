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
  Ticket,
  CalendarDays,
  Users,
  ExternalLink,
} from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types/product";
import { OutletType } from "@/types";
import { ScheduleModal } from "../outlet/ScheduleModal";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { Messages, NestedKeyOf, useLocale, useLocalizedPath, useTranslations } from "@/hooks/useI18n";
import { ProductMediaSlider } from "../shared/ProductMediaSlider";
import { useSnackbar } from "@/hooks/useSnackbar";
import {
  getProductPrice,
  getProductUnit,
  getServiceDuration,
  isProductOutOfStock,
  getTicketAvailableQuota,
  isTicketEventPassed,
  isTicketSoldOut,
} from "@/lib/utils/product";

type Props = {
  slug: string;
  productId: string;
};

export function ProductDetails({ slug, productId }: Props) {
  const router = useRouter();
  const { addItem, getOutletItems } = useCart();
  const snackbar = useSnackbar();
  const { setAppBar, resetAppBar } = useAppBarV2();
  const { isProductSaved, toggleSaveProduct } = useSavedProducts();

  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const t = useTranslations("productDetails");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const locale = useLocale();
  const withLocalizedPath = useLocalizedPath();

  // Query product dan outlet
  const productQuery = useQuery<Product>({
    queryKey: ["product", slug, productId],
    queryFn: () => ProductService.getDetail(productId),
    enabled: Boolean(slug && productId),
    retry: false,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: 'always',
    refetchInterval: 1000 * 60,
  });

  const outletQuery = useQuery<OutletType>({
    queryKey: ["outlet", slug],
    queryFn: () => OutletService.getDetail(slug),
    enabled: Boolean(slug),
    retry: false,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60,
  });

  const product = productQuery.data;
  const outlet = outletQuery.data;

  const productErrorStatus = (productQuery.error as AxiosError | undefined)?.response?.status;
  const outletErrorStatus = (outletQuery.error as AxiosError | undefined)?.response?.status;

  const isProductInSaved = useMemo(
    () => (product ? isProductSaved(product.id) : false),
    [product, isProductSaved],
  );

  const ticketAvailableQuota = useMemo(
    () => (product ? getTicketAvailableQuota(product) : null),
    [product],
  );
  const ticketSoldOut = useMemo(() => (product ? isTicketSoldOut(product) : false), [product]);
  const ticketEventPassed = useMemo(
    () => (product ? isTicketEventPassed(product) : false),
    [product],
  );
  const ticketMaxQuantity = useMemo(() => {
    if (!product || product.type !== "TICKET" || !product.ticket) return null;
    const availableQuota = Math.max(product.ticket.totalQuota - product.ticket.soldCount, 0);
    return Math.min(product.ticket.maxPerOrder, availableQuota);
  }, [product]);

  const inCartQuantity = useMemo(() => {
    if (!product || !outlet) return 0;
    return getOutletItems(outlet.id)
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantity, 0);
  }, [product, outlet, getOutletItems]);

  const ticketReachedMaxOrder = useMemo(
    () =>
      product?.type === "TICKET" &&
      ticketMaxQuantity !== null &&
      inCartQuantity >= ticketMaxQuantity,
    [product, ticketMaxQuantity, inCartQuantity],
  );
  const productOutOfStock = useMemo(
    () => (product ? isProductOutOfStock(product) : false),
    [product],
  );
  const isInactive = product?.status === "INACTIVE";

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
        from === "saved-products" || from === "home"
          ? () => router.back()
          : () => router.push(withLocalizedPath(`/outlet/${slug}?from=product`)),
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
  }, [product, slug, from, router, setAppBar, resetAppBar, t, withLocalizedPath]);

  // Action Handlers
  const handleToggleSaveProduct = useCallback(() => {
    if (!product) return;

    const wasSaved = isProductSaved(product.id);
    toggleSaveProduct(product.id);
    if (wasSaved) {
      snackbar.success("Produk dihapus dari favorit", 2000);
    } else {
      snackbar.success("Produk ditambahkan ke favorit", 2000);
    }
  }, [product, isProductSaved, toggleSaveProduct, snackbar]);

  const handleAddToCart = useCallback(() => {
    if (!product || !outlet) return;

    if (isInactive) {
      snackbar.error("Produk tidak tersedia", 3000);
      return;
    }

    if (product.type === "GOODS" && productOutOfStock) {
      snackbar.error("Produk sudah habis", 3000);
      return;
    }

    if (product.type === "TICKET" && ticketSoldOut) {
      snackbar.error("Tiket sudah habis", 3000);
      return;
    }

    if (product.type === "TICKET" && ticketEventPassed) {
      snackbar.error("Event sudah selesai", 3000);
      return;
    }

    if (product.type === "TICKET" && ticketReachedMaxOrder) {
      snackbar.error("Maksimal pembelian tiket per pesanan sudah tercapai", 3000);
      return;
    }

    try {
      const success = addItem(outlet.id, outlet.name, slug, product, 1);
      if (success) {
        snackbar.success("Berhasil ditambahkan ke keranjang", 2000);
      } else if (product.type === "TICKET") {
        snackbar.error("Maksimal pembelian tiket per pesanan sudah tercapai", 3000);
      } else {
        snackbar.error(t("toast.addProductError"));
      }
    } catch {
      snackbar.error(t("toast.addProductError"));
    }
  }, [
    product,
    outlet,
    addItem,
    t,
    snackbar,
    isInactive,
    productOutOfStock,
    ticketSoldOut,
    ticketEventPassed,
    ticketReachedMaxOrder,
  ]);

  const handleScheduleSelect = useCallback(
    (schedule: any) => {
      if (!outlet || !product) return;
      try {
        const success = addItem(slug, outlet.name, slug, product, 1, schedule);
        if (success) {
          setShowScheduleModal(false);
          snackbar.success("Layanan berhasil ditambahkan ke keranjang", 2000);
        } else {
          snackbar.error("Jadwal bentrok dengan layanan lain di keranjang", 5000);
        }
      } catch {
        snackbar.error(t("toast.addServiceErrorDesc"));
      }
    },
    [slug, outlet, product, addItem, t, snackbar],
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
          value:
            product?.type === "GOODS"
              ? getProductUnit(product) || t("labels.general")
              : product?.type === "TICKET"
                ? t("labels.ticket")
                : t("labels.general"),
        },
        {
          icon: Tag,
          label: t("labels.type"),
          value:
            product?.type === "GOODS"
              ? t("labels.product")
              : product?.type === "TICKET"
                ? t("labels.ticket")
                : t("labels.service"),
        },
        product &&
        getServiceDuration(product) && {
          icon: Clock,
          label: t("labels.duration"),
          value: `${getServiceDuration(product)} ${t("labels.minutes")}`,
        },
        product?.type === "TICKET" &&
        ticketAvailableQuota !== null && {
          icon: Users,
          label: t("labels.available"),
          value: `${ticketAvailableQuota}`,
        },
      ].filter(Boolean) as Array<{
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        value: string;
      }>,
    [product, t, ticketAvailableQuota],
  );

  const productData = useMemo(() => {
    if (product?.type === "GOODS" && product?.goods) {
      return {
        price: product.goods.sellingPrice,
        quantity: product.goods.currentStock,
        unit: product.goods.unit,
        serviceDurationMinutes: null,
        ticketAvailable: null,
        ticketMaxPerOrder: null,
      };
    } else if (product?.type === "SERVICE" && product?.service) {
      return {
        price: product?.service.sellingPrice,
        quantity: null,
        unit: null,
        serviceDurationMinutes: product?.service.durationMinutes,
        ticketAvailable: null,
        ticketMaxPerOrder: null,
      };
    } else if (product?.type === "TICKET" && product?.ticket) {
      const available = product?.ticket.totalQuota - product?.ticket.soldCount;
      return {
        price: product?.ticket.sellingPrice,
        quantity: available,
        unit: "tiket",
        serviceDurationMinutes: null,
        ticketAvailable: available,
        ticketMaxPerOrder: product?.ticket.maxPerOrder,
      };
    }
    return {
      price: 0,
      quantity: null,
      unit: null,
      serviceDurationMinutes: null,
      ticketAvailable: null,
      ticketMaxPerOrder: null,
    };
  }, [product]);

  const isEventPassed =
    product?.type === "TICKET" && product?.ticket && new Date(product?.ticket.eventDate) < new Date();
  const isOutOfStock =
    (product?.type === "GOODS" && productData.quantity !== null && productData.quantity <= 0) ||
    (product?.type === "TICKET" &&
      productData.ticketAvailable !== null &&
      productData.ticketAvailable <= 0);

  const isDisabled = isOutOfStock || isInactive || !!isEventPassed;

  // Loading & Error State
  if (productQuery.isLoading || outletQuery.isLoading) {
    return <LoadingState />;
  }

  if (productErrorStatus === 404 || outletErrorStatus === 404) {
    return (
      <EmptyStates.NotFound
        action={{
          label: "Back to Home",
          onClick: () => router.push(withLocalizedPath("/")),
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
    <div >
      <HeroImage product={product} />

      {/* Content Sheet */}
      <div className=" z-40 rounded-t-2xl bg-background -mx-3 h-[60vh] p-0 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
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

          <OutletCard outlet={outlet} t={t} locale={locale} />

          {product.type === "TICKET" && product.ticket && (
            <TicketInfoSection
              ticket={product.ticket}
              isEventPassed={ticketEventPassed}
              isSoldOut={ticketSoldOut}
              t={t}
            />
          )}

          {formattedDescription && (
            <DescriptionSection
              description={formattedDescription}
              productType={product.type}
              t={t}
            />
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
        isInactive={isDisabled}
        isOutOfStock={productOutOfStock}
        ticketSoldOut={ticketSoldOut}
        ticketEventPassed={ticketEventPassed}
        ticketReachedMaxOrder={Boolean(ticketReachedMaxOrder)}
        t={t}
      />

      {product.type === "SERVICE" && showScheduleModal && (
        <ScheduleModal
          key={slug + productId}
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSelectSchedule={handleScheduleSelect}
          product={product}
          outletId={outlet.id}
        />
      )}
    </div>
  );
}

type HeroImageProps = {
  product: Product;
};

const HeroImage: React.FC<HeroImageProps> = ({ product }) => {
  if (product.media && product.media.length > 0) {
    return (
      <div className="relative -mx-3 p-2 -mt-3 overflow-hidden">
        <ProductMediaSlider
          media={product.media}
          aspectRatio="1/1"
          showControls
          autoPlay={true}
        />
      </div>
    );
  }

  const imageUrl = product.image;
  if (imageUrl) {
    return (
      <div className="relative h-72 sm:h-80 bg-muted -mx-3 p-2 -mt-3 overflow-hidden">
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
      ) : product.type === "TICKET" ? (
        <Ticket className="w-16 h-16 text-primary/30" />
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
        {product.type === "GOODS"
          ? t("labels.product")
          : product.type === "TICKET"
            ? t("labels.ticket")
            : t("labels.service")}
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
          className={cn("w-1.5 h-1.5 rounded-full", outlet.isOpen ? "bg-green-500" : "bg-gray-400")}
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
        <span className="text-sm text-muted-foreground font-medium">
          / {getProductUnit(product)}
        </span>
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
  locale?: string;
};
const OutletCard: React.FC<OutletCardProps> = ({ outlet, t, locale }) => {
  const href = locale
    ? `/${locale}/outlet/${outlet.slug}`
    : `/outlet/${outlet.id}`;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/20 transition-all duration-200 group">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Store className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {t("labels.availableAt")}
        </p>
        <h3 className="text-sm font-semibold truncate mt-0.5">{outlet.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{outlet.address}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
};

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
        type:
          productType === "GOODS"
            ? t("labels.product")
            : productType === "TICKET"
              ? t("labels.ticket")
              : t("labels.service"),
      })}
    </h2>
    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{description}</p>
  </div>
);

type TicketInfoSectionProps = {
  ticket: NonNullable<Product["ticket"]>;
  isSoldOut: boolean;
  isEventPassed: boolean;
  t: (
    key: NestedKeyOf<Messages["productDetails"]>,
    values?: Record<string, string | number>,
  ) => string;
};
const TicketInfoSection: React.FC<TicketInfoSectionProps> = ({
  ticket,
  isSoldOut,
  isEventPassed,
  t,
}) => {
  const availableQuota = Math.max(ticket.totalQuota - ticket.soldCount, 0);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{t("labels.ticketInfo")}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TicketInfoItem
          icon={CalendarDays}
          label={t("labels.eventDate")}
          value={formatDateTime(ticket.eventDate)}
        />
        <TicketInfoItem icon={MapPin} label={t("labels.venue")} value={ticket.venue} />
        <TicketInfoItem
          icon={Users}
          label={t("labels.quota")}
          value={`${availableQuota}/${ticket.totalQuota}`}
        />
        <TicketInfoItem
          icon={Ticket}
          label={t("labels.maxPerOrder")}
          value={`${ticket.maxPerOrder}`}
        />
      </div>

      {(ticket.saleStartDate || ticket.saleEndDate) && (
        <div className="rounded-md border border-border/60 bg-background px-3 py-2 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{t("labels.salePeriod")}</p>
          <p className="text-sm font-medium text-foreground">
            {ticket.saleStartDate ? formatDateTime(ticket.saleStartDate) : "-"} -{" "}
            {ticket.saleEndDate ? formatDateTime(ticket.saleEndDate) : "-"}
          </p>
        </div>
      )}

      {ticket.venueAddress && (
        <p className="text-xs text-muted-foreground">
          {t("labels.venueAddress")}: {ticket.venueAddress}
        </p>
      )}

      {ticket.mapUrl && (
        <Link
          href={ticket.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" /> {t("buttons.openMap")}
        </Link>
      )}

      {(isSoldOut || isEventPassed) && (
        <Badge variant="secondary" className="rounded-full">
          {isEventPassed ? t("labels.eventPassed") : t("labels.outOfStock")}
        </Badge>
      )}

      {ticket.terms && (
        <div className="rounded-md border border-border/60 bg-background px-3 py-2 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{t("labels.ticketTerms")}</p>
          <p className="text-sm text-foreground/80 whitespace-pre-line">{ticket.terms}</p>
        </div>
      )}
    </div>
  );
};

type TicketInfoItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};
const TicketInfoItem: React.FC<TicketInfoItemProps> = ({ icon: Icon, label, value }) => (
  <div className="rounded-md border border-border/60 bg-background px-3 py-2 space-y-1">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      <p className="text-xs font-medium">{label}</p>
    </div>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

type BottomActionsProps = {
  product: Product;
  outlet: OutletType;
  isProductInSaved: boolean;
  onSave: () => void;
  onAddToCart: () => void;
  onOpenSchedule: () => void;
  isInactive: boolean;
  isOutOfStock: boolean;
  ticketSoldOut: boolean;
  ticketEventPassed: boolean;
  ticketReachedMaxOrder: boolean;
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
  isInactive,
  isOutOfStock,
  ticketSoldOut,
  ticketEventPassed,
  ticketReachedMaxOrder,
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
          disabled={isInactive || isOutOfStock}>
          <ShoppingCart className="w-4 h-4" /> {t("buttons.addToCart")}
        </Button>
      )}

      {product.type === "SERVICE" && (
        <Button
          size="lg"
          className="flex-1 h-11 rounded-full font-semibold text-sm shadow-sm gap-2"
          onClick={onOpenSchedule}
          disabled={isInactive}>
          <Clock className="w-4 h-4" /> {t("buttons.bookService")}
        </Button>
      )}

      {product.type === "TICKET" && (
        <Button
          size="lg"
          className="flex-1 h-11 rounded-full font-semibold text-sm shadow-sm gap-2"
          onClick={onAddToCart}
          disabled={isInactive || ticketSoldOut || ticketEventPassed || ticketReachedMaxOrder}
        >
          <Ticket className="w-4 h-4" /> {t("buttons.buyTicket")}
        </Button>
      )}
    </div>
  </div>
);
