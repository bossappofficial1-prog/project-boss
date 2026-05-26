"use client";

import { useRouter } from "next/navigation";
import { FilterBar } from "./FilterBar";
import { useTranslations } from "@/hooks/useI18n";
import { useFavorites } from "@/hooks/useFavorites";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useFavoritesState } from "@/hooks/useFavoriteState";
import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import { ValidationAlert } from "./ValidationAlert";
import { FavoritesList } from "./FavoritesList";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmationModal } from "../Base";

export default function FavoritesPage() {
  const router = useRouter();
  const t = useTranslations("favorites");
  const { favorites, clearFavorites, removeFavorite } = useFavorites();
  const { setAppBar, resetAppBar } = useAppBarV2();

  // State Management linked to our real GPS & Live API validation hook
  const {
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    showOnlyAvailable,
    setShowOnlyAvailable,
    validationResults,
    processedFavorites,
    isValidating,
    isLoading,
  } = useFavoritesState(favorites);

  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const invalidCount = validationResults?.invalid?.length || 0;
  const validCount = validationResults?.valid?.length || 0;

  // Manage native app bar header
  useEffect(() => {
    setAppBar({
      title: t("title"),
      subtitle:
        validCount > 0
          ? t("controls.availableOutlets", { count: validCount })
          : t("subtitle"),
      showSearch: false,
      centerTitle: true,
      showPartnerToggle: false,
      showBackButton: true,
    });
    return () => resetAppBar();
  }, [setAppBar, resetAppBar, t, validCount, router]);

  // Show validation alert banner if invalid (deleted/inactive) items are found
  useEffect(() => {
    if (invalidCount > 0) {
      setShowValidationAlert(true);
    }
  }, [invalidCount]);

  const handleRemoveInvalidOutlets = useCallback(() => {
    if (validationResults?.invalid) {
      validationResults.invalid.forEach((outlet) => removeFavorite(outlet.id));
      setShowValidationAlert(false);
    }
  }, [validationResults, removeFavorite]);

  const handleBrowseOutlets = () => router.push("/nearby");

  // A. Premium Empty State (If customer has no favorited outlets at all)
  if (!isLoading && favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="space-y-6 max-w-sm mx-auto flex flex-col items-center"
        >
          {/* Bouncy Floating Heart illustration */}
          <div className="relative">
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center shadow-inner relative z-10"
            >
              <Heart className="w-9 h-9 text-rose-500 fill-current" />
            </motion.div>

            {/* Glowing background halo */}
            <div className="absolute inset-0 bg-rose-400/20 blur-2xl rounded-full scale-110 z-0 animate-pulse" />
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
              onClick={handleBrowseOutlets}
              className="w-full h-11 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10"
            >
              {t("empty.browse")}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="space-y-0 fixed inset-0 z-10 min-h-screen pb-16"
      style={{
        top: "var(--appbar-height, 56px)",
      }}
    >
      {/* 1. Custom Interactive Filter Bar */}
      <FilterBar
        totalCount={favorites.length}
        shownCount={processedFavorites.length}
        invalidCount={invalidCount}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showOnlyAvailable={showOnlyAvailable}
        setShowOnlyAvailable={setShowOnlyAvailable}
        onClearRequest={() => setShowClearDialog(true)}
        t={t}
      />

      {/* 2. Scrollable Body Container */}
      <div className="px-4 py-4 max-w-4xl mx-auto space-y-4">
        {/* Validating indicator bar (smooth slide-down) */}
        <AnimatePresence>
          {isValidating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-muted/40 border border-border/10 rounded-lg text-[10px] font-semibold text-muted-foreground animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                <span>Memperbarui status live outlet...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Alert Banner */}
        <AnimatePresence>
          {showValidationAlert && invalidCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ValidationAlert
                count={invalidCount}
                onRemoveInvalid={handleRemoveInvalidOutlets}
                onDismiss={() => setShowValidationAlert(false)}
                t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Main Outlet List with framer-motion grid transitions */}
        <FavoritesList
          outlets={processedFavorites}
          viewMode={viewMode}
          isValidating={isValidating}
          validationResults={validationResults}
          onRemove={removeFavorite}
          showOnlyAvailable={showOnlyAvailable}
          isLoading={isLoading}
          t={t}
        />
      </div>

      {/* 4. Native-like Clear All Dialog */}
      <ConfirmationModal
        isOpen={showClearDialog}
        title={t("confirm.clearAllTitle")}
        message={t("confirm.clearAllDesc")}
        onClose={() => setShowClearDialog(!showClearDialog)}
        variant="destructive"
        confirmText={t("confirm.clear")}
        cancelText={t("buttons.cancel")}
        onConfirm={() => {
          clearFavorites();
          setShowClearDialog(false);
        }}
      />
    </div>
  );
}
