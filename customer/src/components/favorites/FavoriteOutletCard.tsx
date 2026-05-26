"use client";

import { useRouter } from "next/navigation";
import { useFavorites, FavoriteOutlet } from "@/hooks/useFavorites";
import { useTranslations } from "@/hooks/useI18n";
import { ImageRender } from "@/components/shared/Image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Store, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FavoriteOutletCardProps {
  outlet: FavoriteOutlet & { distance?: number };
  isValidating?: boolean;
  validationStatus?: "valid" | "invalid" | "loading";
  onRemove?: (id: string) => void;
  viewMode?: "grid" | "list";
}

export default function FavoriteOutletCard({
  outlet,
  isValidating = false,
  validationStatus,
  onRemove,
  viewMode = "grid",
}: FavoriteOutletCardProps) {
  const { removeFavorite } = useFavorites();
  const tOutlet = useTranslations("outletDetail");
  const tFav = useTranslations("favorites");
  const router = useRouter();

  const isValid = validationStatus === "valid";
  const isInvalid = validationStatus === "invalid";
  const isLoading = validationStatus === "loading" || isValidating;

  const handleCardClick = () => {
    if (!isInvalid) {
      router.push(`/outlet/${outlet.id}?from=favorites`);
    }
  };

  const handleRemoveFromFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove ? onRemove(outlet.id) : removeFavorite(outlet.id);
  };

  // Premium Indonesian Time Ago formatting
  const timeAgo = formatDistanceToNow(new Date(outlet.addedAt), {
    addSuffix: true,
    locale: id,
  });

  const formattedDistance =
    outlet.distance !== undefined
      ? outlet.distance < 1
        ? `${Math.round(outlet.distance * 1000)} m`
        : `${outlet.distance.toFixed(1)} km`
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={isInvalid ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full"
    >
      <Card
        onClick={handleCardClick}
        className={cn(
          "group relative overflow-hidden transition-all duration-300 border border-border/50 bg-card p-0 shadow-sm",
          isInvalid
            ? "opacity-60 border-destructive/20 bg-destructive/5 cursor-not-allowed"
            : "cursor-pointer hover:shadow-md hover:border-primary/20"
        )}
      >
        {viewMode === "list" ? (
          <CardContent className="p-0">
            <div className="flex w-full h-28 relative">
              {/* Left: Beautiful Image Container */}
              <div className="relative w-32 h-full flex-shrink-0 overflow-hidden bg-muted/40 border-r border-border/10">
                {outlet.image ? (
                  <ImageRender
                    src={outlet.image}
                    alt={outlet.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
                    <Store className="w-8 h-8 text-primary/40" />
                  </div>
                )}

                {/* Floating validation states */}
                {isLoading && !isInvalid && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
                {isInvalid && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/15 backdrop-blur-[2px]">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                )}

                {/* Floating Open/Closed Status on Image */}
                {!isInvalid && outlet.isOpen !== undefined && (
                  <div className="absolute bottom-1.5 left-1.5 z-10">
                    <Badge
                      variant={outlet.isOpen ? "default" : "secondary"}
                      className={cn(
                        "text-[9px] px-1.5 py-0 h-4.5 font-bold uppercase tracking-wider",
                        outlet.isOpen
                          ? "bg-emerald-500 text-white hover:bg-emerald-500"
                          : "bg-slate-600 text-white hover:bg-slate-600"
                      )}
                    >
                      {outlet.isOpen ? tOutlet("open") : tOutlet("closed")}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Right: Detailed Content Area */}
              <div className="flex-1 h-full p-3.5 flex flex-col gap-1 min-w-0">
                <div className="flex items-start gap-2 justify-between">
                  <h3
                    className={cn(
                      "font-semibold text-xs leading-snug line-clamp-2 flex-1 tracking-tight pr-1",
                      isInvalid ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {outlet.name}
                  </h3>
                  
                  {/* Animated Heart Button */}
                  <motion.div whileTap={{ scale: 0.75 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFromFavorites}
                      className="h-7 w-7 p-0 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex-shrink-0"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </motion.div>
                </div>

                {/* Distance Badge & Location Text */}
                <div className="flex items-start gap-1 text-[10px] text-muted-foreground min-w-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1.5 truncate flex-1 leading-normal">
                    {formattedDistance && (
                      <span className="font-bold text-primary flex-shrink-0 bg-primary/5 px-1 py-0.5 rounded">
                        {formattedDistance}
                      </span>
                    )}
                    <span className="truncate">{outlet.address}</span>
                  </div>
                </div>

                {/* Bottom section: Validation badges & Time added */}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {validationStatus !== undefined && (
                      <Badge
                        variant={isValid ? "default" : "destructive"}
                        className={cn(
                          "text-[9px] px-1.5 py-0 h-4.5 font-bold tracking-tight",
                          isValid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50"
                        )}
                      >
                        {isValid ? tFav("validation.available") : tFav("validation.unavailable")}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Clock className="w-3 h-3 text-muted-foreground/75" />
                    <span className="whitespace-nowrap font-medium">{timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            {/* Top: Image Area */}
            <div className="relative h-32 w-full overflow-hidden bg-muted/40 border-b border-border/10">
              {outlet.image ? (
                <ImageRender
                  src={outlet.image}
                  alt={outlet.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
                  <Store className="w-10 h-10 text-primary/40" />
                </div>
              )}

              {/* Floating overlays */}
              {isLoading && !isInvalid && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {isInvalid && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/15 backdrop-blur-[2px]">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
              )}

              {/* Float Open/Closed status tag on image */}
              {!isInvalid && outlet.isOpen !== undefined && (
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge
                    variant={outlet.isOpen ? "default" : "secondary"}
                    className={cn(
                      "text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider",
                      outlet.isOpen
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-600 text-white"
                    )}
                  >
                    {outlet.isOpen ? tOutlet("open") : tOutlet("closed")}
                  </Badge>
                </div>
              )}

              {/* Floating distance tag on image */}
              {formattedDistance && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-[9px] font-bold text-white bg-primary backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm">
                    {formattedDistance}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom: Details Area */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-1.5">
                <h3
                  className={cn(
                    "font-semibold text-xs truncate flex-1 tracking-tight pr-1",
                    isInvalid ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {outlet.name}
                </h3>
                
                <motion.div whileTap={{ scale: 0.75 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFromFavorites}
                    className="h-7 w-7 p-0 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex-shrink-0"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </Button>
                </motion.div>
              </div>

              {/* Location Row */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate leading-normal">{outlet.address}</span>
              </div>

              {/* Status and Time Added row */}
              <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1.5 border-t border-border/10">
                <div className="flex items-center gap-1.5">
                  {validationStatus !== undefined && (
                    <Badge
                      variant={isValid ? "default" : "destructive"}
                      className={cn(
                        "text-[8px] px-1 py-0 h-4 font-bold tracking-tight",
                        isValid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      )}
                    >
                      {isValid ? tFav("validation.available") : tFav("validation.unavailable")}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-muted-foreground/75" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
