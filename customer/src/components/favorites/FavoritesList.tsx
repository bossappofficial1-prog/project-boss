"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import FavoriteOutletCard from "./FavoriteOutletCard";
import { cn } from "@/lib/utils";

export const FavoritesList = ({
  outlets,
  viewMode,
  isValidating,
  validationResults,
  onRemove,
  showOnlyAvailable,
  isLoading,
  t,
}: any) => {
  // Premium Pulsating Skeleton Loader
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "grid-cols-1 xs:grid-cols-2 md:grid-cols-3"
            : "grid-cols-1",
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "border border-border/40 bg-card rounded-xl p-3 space-y-3 animate-pulse shadow-sm",
              viewMode === "list" && "flex gap-3 items-center h-28 space-y-0",
            )}
          >
            {viewMode === "list" ? (
              <>
                <div className="w-32 h-full bg-muted rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4 mt-auto" />
                </div>
              </>
            ) : (
              <>
                <div className="h-32 bg-muted rounded-lg w-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Filtered Empty State
  if (outlets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-20 px-4 max-w-sm mx-auto flex flex-col items-center justify-center space-y-4"
      >
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Heart className="w-6 h-6 text-muted-foreground opacity-60" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            {t("controls.noResults")}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {showOnlyAvailable
              ? t("controls.tryDisablingFilter")
              : t("controls.emptyList")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        viewMode === "grid"
          ? "grid-cols-1 xs:grid-cols-2 md:grid-cols-3"
          : "grid-cols-1",
      )}
    >
      <AnimatePresence mode="popLayout">
        {outlets.map((outlet: any) => {
          const status = validationResults?.valid.some(
            (v: any) => v.id === outlet.id,
          )
            ? "valid"
            : validationResults?.invalid.some((v: any) => v.id === outlet.id)
              ? "invalid"
              : isValidating
                ? "loading"
                : undefined;

          return (
            <motion.div
              key={outlet.id}
              layout
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 35,
              }}
              className="w-full"
            >
              <FavoriteOutletCard
                outlet={outlet}
                isValidating={isValidating}
                validationStatus={status}
                onRemove={onRemove}
                viewMode={viewMode}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
