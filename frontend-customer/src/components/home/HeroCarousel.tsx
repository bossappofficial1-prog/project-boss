"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo } from "react"
import { useCarousel } from "@/hooks/useCarousel"
import { useTranslations } from "@/hooks/useI18n"
import { Button } from "@/components/ui/button"
import { ImageRender } from "@/components/shared/Image"
import type { HomeBanner } from "@/types/home"

interface HeroCarouselProps {
    banners: HomeBanner[]
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
    const slides = useMemo(() => banners.filter(Boolean), [banners])
    const t = useTranslations("homePage")

    const { active, isInteracting, isDragging, goTo, prev, next, handlers } = useCarousel({
        count: slides.length,
        autoplay: true,
    })

    if (slides.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-md border border-border/40 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-4 text-primary">
                <div className="max-w-xl space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-wide">{t("hero.badge")}</p>
                    <h2 className="text-2xl font-bold leading-tight">{t("hero.fallbackTitle")}</h2>
                    <p className="text-sm text-primary/70">{t("hero.fallbackSubtitle")}</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="relative overflow-hidden rounded-lg border border-border/40 shadow-sm"
            role="region"
            aria-roledescription="carousel"
            aria-label={t("hero.badge")}
            {...handlers}
        >
            <ul
                className="relative flex"
                style={{
                    transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `translateX(calc(-${active * 100}% + var(--slide-offset, 0px)))`,
                }}
            >
                {slides.map((banner, index) => (
                    <li
                        key={banner.id}
                        className="relative min-w-full max-h-[210px] flex-shrink-0"
                        aria-hidden={index !== active}
                        aria-roledescription="slide"
                    >
                        <div className="absolute inset-0">
                            <img
                                src={banner.imageUrl}
                                alt={banner.title ?? "Banner"}
                                className="h-full w-full object-cover"
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
                        </div>

                        {/* Wrapper untuk konten agar bisa dianimasikan */}
                        <div className="relative flex min-h-[240px] flex-col justify-center px-6 py-8 text-white sm:px-8">
                            {/* KUNCI ANIMASI:
                                Menambahkan `key={active}` akan membuat React me-remount
                                komponen ini setiap kali slide aktif berubah, sehingga
                                memicu ulang animasi `animate-in`.
                            */}
                            {index === active && (
                                <div key={active} className="animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
                                    <div className="flex flex-col gap-3">
                                        {/* <p className="text-sm font-semibold uppercase tracking-wider text-white/80">{t("hero.badge")}</p> */}
                                        <h2 className="text-2xl font-bold leading-tight line-clamp-2 sm:text-3xl sm:max-w-lg">
                                            {banner.title ?? t("hero.defaultTitle")}
                                        </h2>
                                        <p className="text-sm leading-relaxed text-white/90 line-clamp-3 sm:text-base sm:max-w-lg">
                                            {banner.subtitle ?? t("hero.defaultSubtitle")}
                                        </p>
                                        {banner.cta && (
                                            <Link href={banner.cta.payload || "/promos"} target="_blank" className="mt-2" tabIndex={index !== active ? -1 : 0}>
                                                <Button size="sm" variant="secondary" className="bg-white/95 text-primary hover:bg-white">
                                                    {t("hero.cta")}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {/* Navigation Controls */}
            {slides.length > 1 && (
                <>
                    {/* Container untuk panah navigasi */}
                    <div
                        className={`absolute inset-0 z-10 flex items-center justify-between px-4 transition-opacity duration-300 ${isInteracting ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >
                        <button
                            type="button"
                            onClick={prev}
                            aria-label={t("hero.prev")}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-black/50 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label={t("hero.next")}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-black/50 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goTo(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}