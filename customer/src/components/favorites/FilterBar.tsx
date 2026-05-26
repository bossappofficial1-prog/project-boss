"use client";

import { Filter, Grid, List, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FilterBar = ({
  totalCount,
  shownCount,
  invalidCount,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  showOnlyAvailable,
  setShowOnlyAvailable,
  onClearRequest,
  t,
}: any) => {
  const ViewToggle = () => (
    <div className="flex items-center bg-muted/60 p-1 rounded-lg relative border border-border/10 shrink-0 select-none">
      {/* Grid Switch Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode("grid")}
        className={cn(
          "h-7 w-7 p-0 rounded-md relative z-10 transition-colors duration-200",
          viewMode === "grid"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Grid className="w-3.5 h-3.5" />
      </Button>

      {/* List Switch Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode("list")}
        className={cn(
          "h-7 w-7 p-0 rounded-md relative z-10 transition-colors duration-200",
          viewMode === "list"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="w-3.5 h-3.5" />
      </Button>

      {/* Sliding background layout selector bubble */}
      <motion.div
        layout
        className="absolute top-1 bottom-1 bg-background rounded-md shadow-sm border border-border/20 z-0"
        style={{
          width: "28px",
          left: viewMode === "grid" ? "4px" : "32px",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </div>
  );

  const SortSelect = () => (
    <div className="relative shrink-0">
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger
          size="sm"
          className="h-9 text-xs w-30 sm:w-36.25 rounded-lg bg-background border-border/60 hover:bg-accent/30 transition-colors pl-2.5 pr-1"
        >
          <div className="flex items-center gap-1.5 truncate">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground shrink-0" />
            <SelectValue placeholder={t("sort.label")} />
          </div>
        </SelectTrigger>
        <SelectContent className="text-xs rounded-xl shadow-lg border border-border/50">
          <SelectItem value="dateAdded" className="rounded-md">
            {t("sort.dateAdded")}
          </SelectItem>
          <SelectItem value="name" className="rounded-md">
            {t("sort.name")}
          </SelectItem>
          <SelectItem value="distance" className="rounded-md">
            Terdekat
          </SelectItem>
          <SelectItem value="status" className="rounded-md">
            {t("sort.status")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const AvailabilityToggle = () => (
    <motion.div whileTap={{ scale: 0.96 }} className="shrink-0">
      <Button
        variant={showOnlyAvailable ? "default" : "outline"}
        size="sm"
        onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
        className={cn(
          "gap-1.5 text-xs h-9 rounded-lg px-3 transition-all duration-300 font-semibold border-border/60",
          showOnlyAvailable
            ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
            : "bg-background text-foreground hover:bg-accent/40",
        )}
      >
        <Filter className="w-3.5 h-3.5 shrink-0" />
        <span>{t("controls.availableOnly")}</span>
      </Button>
    </motion.div>
  );

  return (
    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/30 px-3.5 py-2.5 shadow-sm">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between max-w-4xl mx-auto">
        {/* Swipable Left Side Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-0.5 sm:pb-0">
          <AvailabilityToggle />
          <SortSelect />
          <ViewToggle />

          {invalidCount > 0 && (
            <Badge
              variant="destructive"
              className="h-6 px-2.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap bg-rose-500 text-white border-none animate-pulse shrink-0"
            >
              {invalidCount} {t("validation.unavailable")}
            </Badge>
          )}
        </div>

        {/* Counter & Action Controls on Right Side */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-muted-foreground w-full sm:w-auto">
          <span className="font-semibold text-muted-foreground/90">
            {t("controls.resultsCount", {
              shown: shownCount,
              total: totalCount,
            })}
          </span>

          {totalCount > 0 && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold tracking-tight transition-colors"
                onClick={onClearRequest}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>Hapus Semua</span>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
