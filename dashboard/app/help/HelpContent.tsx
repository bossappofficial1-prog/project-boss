"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const resolveIcon = (name: string) => {
  const Icon = (Icons as any)[name];
  return Icon || Icons.HelpCircle;
};

interface GuideStep {
  title: string;
  desc: string;
}

interface GuideItem {
  id: string;
  role: "owner" | "cashier";
  category: string;
  title: string;
  description: string;
  icon: string;
  steps: GuideStep[];
  tip?: string;
  warning?: string;
  pinned?: boolean;
}

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
}

interface HelpContentProps {
  ownerCategories: CategoryItem[];
  cashierCategories: CategoryItem[];
  guides: GuideItem[];
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-primary/20 text-foreground rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default function HelpContent({
  ownerCategories,
  cashierCategories,
  guides,
}: HelpContentProps) {
  const [activePortal, setActivePortal] = useState<"owner" | "cashier">(
    "owner",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-detect the portal based on URL query param or user role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get("portal");
      if (portalParam === "owner" || portalParam === "cashier") {
        setActivePortal(portalParam);
      } else {
        const storedRole = sessionStorage.getItem("auth-role");
        if (storedRole === "CASHIER" || storedRole === "MANAGER") {
          setActivePortal("cashier");
        } else {
          setActivePortal("owner");
        }
      }
    }
  }, []);

  const currentCategories = useMemo(() => {
    return activePortal === "owner" ? ownerCategories : cashierCategories;
  }, [activePortal, ownerCategories, cashierCategories]);

  const portalGuides = useMemo(() => {
    return guides.filter((g) => g.role === activePortal);
  }, [guides, activePortal]);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = { all: portalGuides.length };
    portalGuides.forEach((g) => {
      map[g.category] = (map[g.category] ?? 0) + 1;
    });
    return map;
  }, [portalGuides]);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return portalGuides.filter((guide) => {
      const matchesSearch =
        !q ||
        guide.title.toLowerCase().includes(q) ||
        guide.description.toLowerCase().includes(q) ||
        guide.steps.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.desc.toLowerCase().includes(q),
        );
      const matchesCategory =
        activeCategory === "all" || guide.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [portalGuides, searchQuery, activeCategory]);

  const pinnedGuides = useMemo(
    () => (searchQuery ? [] : filteredGuides.filter((g) => g.pinned)),
    [filteredGuides, searchQuery],
  );

  const regularGuides = useMemo(
    () =>
      searchQuery ? filteredGuides : filteredGuides.filter((g) => !g.pinned),
    [filteredGuides, searchQuery],
  );

  const handleToggleGuide = useCallback((id: string) => {
    setExpandedGuides((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleCollapseAll = useCallback(() => setExpandedGuides(new Set()), []);

  const handleExpandAll = useCallback(() => {
    setExpandedGuides(new Set(filteredGuides.map((g) => g.id)));
  }, [filteredGuides]);

  const handleReset = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("all");
  }, []);

  const hasExpanded = expandedGuides.size > 0;

  return (
    <div className="space-y-6 max-w-5xl mt-4 mx-auto px-1 sm:px-2 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Icons.HelpCircle className="h-6 w-6 text-primary" />
            Pusat Panduan & Bantuan BOSS
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Panduan lengkap, langkah demi langkah, dan tips operasional sistem
            BOSS.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAll}
              className="text-xs gap-1.5"
            >
              <Icons.ChevronsUpDown className="h-3.5 w-3.5" />
              Tutup Semua
            </Button>
          )}
          {filteredGuides.length > 0 && !hasExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="text-xs gap-1.5"
            >
              <Icons.ChevronsDownUp className="h-3.5 w-3.5" />
              Buka Semua
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Control / Tabs to Switch Portals */}
      <div className="flex p-1 bg-muted rounded-xl max-w-md mx-auto shadow-xs border border-border/50">
        <button
          onClick={() => {
            setActivePortal("owner");
            setActiveCategory("all");
            setSearchQuery("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
            activePortal === "owner"
              ? "bg-background text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icons.Building2 className="h-4 w-4" />
          Portal Owner
        </button>
        <button
          onClick={() => {
            setActivePortal("cashier");
            setActiveCategory("all");
            setSearchQuery("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
            activePortal === "cashier"
              ? "bg-background text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icons.Smartphone className="h-4 w-4" />
          Portal Kasir
        </button>
      </div>

      {/* Search Input & Sticky Categories */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-1 pb-3 space-y-3 -mx-1 px-1">
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            id="guide-search"
            type="text"
            placeholder={
              activePortal === "owner"
                ? "Cari topik bantuan, fitur, atau panduan owner..."
                : "Cari topik bantuan, fitur, atau panduan kasir..."
            }
            className="pl-10 pr-10 h-11 rounded-lg border-border bg-card shadow-sm text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Icons.X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {currentCategories.map((cat) => {
            const Icon = resolveIcon(cat.icon);
            const isActive = activeCategory === cat.id;
            const count = countByCategory[cat.id] ?? 0;
            return (
              <Button
                key={cat.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full shrink-0 gap-1.5 text-xs px-3 h-8 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm animate-fadeIn"
                    : "text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-0.5 h-4 px-1.5 text-[10px] font-semibold rounded-full"
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {searchQuery && (
        <p className="text-xs text-muted-foreground">
          {filteredGuides.length > 0
            ? `${filteredGuides.length} hasil ditemukan untuk "${searchQuery}"`
            : `Tidak ada hasil untuk "${searchQuery}"`}
        </p>
      )}

      {!searchQuery && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 animate-fadeIn">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
            <Icons.Info className="h-4 w-4" />
          </div>
          {activePortal === "owner" ? (
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-primary leading-tight">
                Pengenalan Fitur BOSS POS
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                BOSS dirancang untuk mengelola multi-outlet secara real-time.
                Beralih antar outlet dari panel atas untuk melacak penjualan,
                stok, dan kasir dari satu akun pusat.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-primary leading-tight">
                Sistem Operasional Kasir & Terminal POS
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Terminal Kasir POS dirancang untuk melayani transaksi secara
                cepat dan efisien. Gunakan tombol Buka Shift di awal hari, hold
                bill untuk meja dine-in, dan pastikan rekap kas saat Tutup
                Shift.
              </p>
            </div>
          )}
        </div>
      )}

      {pinnedGuides.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <Icons.Pin className="h-3 w-3" />
            Panduan Populer
          </p>
          <GuideList
            guides={pinnedGuides}
            expandedGuides={expandedGuides}
            onToggle={handleToggleGuide}
            searchQuery={searchQuery}
          />
        </div>
      )}

      {regularGuides.length > 0 ? (
        <div className="space-y-2">
          {pinnedGuides.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Semua Panduan
            </p>
          )}
          <GuideList
            guides={regularGuides}
            expandedGuides={expandedGuides}
            onToggle={handleToggleGuide}
            searchQuery={searchQuery}
          />
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card space-y-3">
          <Icons.HelpCircle className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">
              Topik Bantuan Tidak Ditemukan
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-normal">
              Tidak ada panduan yang cocok. Coba gunakan kata kunci lainnya atau
              ubah kategori filter.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs rounded-full"
          >
            Reset Pencarian
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-5 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
            <Icons.Users className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold">
              Butuh bantuan lebih lanjut?
            </h3>
            <p className="text-xs text-muted-foreground max-w-md leading-normal">
              Tim Support BOSS siap membantu 24/7. Hubungi kami jika menemui
              kendala teknis.
            </p>
          </div>
        </div>
        <Button
          id="btn-whatsapp-support"
          asChild
          className="rounded-full font-medium px-5 text-xs gap-2 shrink-0 cursor-pointer"
        >
          <a
            href="https://wa.me/6283180541892"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hubungi via WhatsApp
            <Icons.ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

interface GuideListProps {
  guides: GuideItem[];
  expandedGuides: Set<string>;
  onToggle: (id: string) => void;
  searchQuery: string;
}

function GuideList({
  guides,
  expandedGuides,
  onToggle,
  searchQuery,
}: GuideListProps) {
  return (
    <div className="space-y-2">
      {guides.map((guide) => {
        const Icon = resolveIcon(guide.icon);
        const isExpanded = expandedGuides.has(guide.id);
        return (
          <Card
            key={guide.id}
            id={`guide-card-${guide.id}`}
            className={`rounded-lg border bg-card shadow-sm overflow-hidden py-0 gap-0 ${
              isExpanded ? "border-primary/30" : "border-border"
            }`}
          >
            <div
              className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
              onClick={() => onToggle(guide.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isExpanded
                      ? "bg-primary/10 text-primary animate-scaleIn"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                    {highlight(guide.title, searchQuery)}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 leading-normal">
                    {highlight(guide.description, searchQuery)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium hidden sm:flex"
                >
                  {guide.steps.length} langkah
                </Badge>
                <div
                  className={`p-1 rounded-md text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? "rotate-90 text-primary" : ""
                  }`}
                >
                  <Icons.ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {isExpanded && (
              <CardContent className="px-4 pb-5 pt-0 border-t border-border/60 space-y-4 animate-fadeInUp">
                <div className="relative pl-5 border-l border-border space-y-4 mt-4">
                  <div className="space-y-3 mt-4">
                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground leading-snug">
                            {highlight(step.title, searchQuery)}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {highlight(step.desc, searchQuery)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {guide.tip && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3.5 flex items-start gap-3">
                    <Icons.CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        Tips Sukses
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {guide.tip}
                      </p>
                    </div>
                  </div>
                )}

                {guide.warning && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 flex items-start gap-3">
                    <Icons.AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-destructive">
                        Perhatian Penting
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {guide.warning}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
