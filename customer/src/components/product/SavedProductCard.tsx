"use client";

import React from "react";
import { Product } from "@/types/product";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageRender } from "@/components/shared/Image";
import { formatCurrency } from "@/lib/utils";
import { Package, Wrench, Store } from "lucide-react";
import { useTranslations } from "@/hooks/useI18n";
import { getProductPrice, getProductUnit, getServiceDuration } from "@/lib/utils/product";

interface SavedProductCardProps {
  product: Product;
  onClick: () => void;
}

export function SavedProductCard({ product, onClick }: SavedProductCardProps) {
  const t = useTranslations("productDetails");

  return (
    <Card
      className="overflow-hidden p-0 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] touch-manipulation select-none"
      onClick={onClick}>
      <div className="flex h-24 sm:h-28">
        {/* Product Image - Left Side */}
        <div className="relative w-24 sm:w-28 h-full bg-muted flex-shrink-0">
          {product.media && product.media.length > 0 && product.media[0].type === "IMAGE" ? (
            <ImageRender
              src={product.media[0].url}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : product.image ? (
            <ImageRender
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
              <Store className="w-6 h-6 text-primary/40" />
            </div>
          )}

          {/* Product Type Badge - Overlayed on image */}
          <Badge
            variant="secondary"
            className="absolute top-1 left-1 text-xs rounded-full px-1.5 py-0.5 backdrop-blur-sm bg-background/90">
            {product.type === "GOODS" ? (
              <Package className="w-2.5 h-2.5" />
            ) : (
              <Wrench className="w-2.5 h-2.5" />
            )}
          </Badge>
        </div>

        {/* Product Info - Right Side */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
          {/* Top Section: Name and Status */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2 leading-tight flex-1 pr-6">
                {product.name}
              </h3>
            </div>

            {/* Description - only show on larger screens */}
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                {product.description}
              </p>
            )}
          </div>

          {/* Bottom Section: Price and Duration */}
          <div className="flex items-end justify-between mt-2">
            <div className="flex flex-row gap-1 justify-center items-center">
              <span className="text-sm sm:text-xl font-bold text-primary">
                {formatCurrency(getProductPrice(product))}
              </span>
              {getProductUnit(product) && (
                <span className="text-xs text-muted-foreground">/ {getProductUnit(product)}</span>
              )}
            </div>

            {getServiceDuration(product) && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full flex-shrink-0">
                <span>
                  {getServiceDuration(product)} {t("labels.minutes")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
