"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { useMemo } from "react"
import { useCarousel } from "@/hooks/useCarousel"
import { useTranslations } from "@/hooks/useI18n"
import type { HomeBanner } from "@/types/home"
import Image from "next/image"

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
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 sm:p-8">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
                <div className="relative max-w-md space-y-3">
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                        {t("hero.badge")}
                    </span>
                    <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                        {t("hero.fallbackTitle")}
                    </h2>
                    <p className="text-sm leading-relaxed text-white/80">
                        {t("hero.fallbackSubtitle")}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="group relative overflow-hidden rounded-xl shadow-lg"
            role="region"
            aria-roledescription="carousel"
            aria-label={t("hero.badge")}
            {...handlers}
        >
            {/* Slides */}
            <div className="aspect-[16/9] sm:aspect-[2/1] md:aspect-[21/9]">
                <ul
                    className="relative h-full flex"
                    style={{
                        transition: isDragging ? "none" : "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)",
                        transform: `translateX(calc(-${active * 100}% + var(--slide-offset, 0px)))`,
                    }}
                >
                    {slides.map((banner, index) => (
                        <li
                            key={banner.id}
                            className="relative min-w-full flex-shrink-0"
                            aria-hidden={index !== active}
                            aria-roledescription="slide"
                        >
                            {/* Image */}
                            <div className="absolute inset-0">
                                <Image
                                    src={banner.imageUrl}
                                    alt={banner.title ?? "Banner"}
                                    className="h-full w-full object-cover transition-transform duration-[8s] ease-out"
                                    style={{ transform: index === active ? "scale(1.05)" : "scale(1)" }}
                                    sizes="100vw"
                                    fill
                                />
                                {/* Multi-layer gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                            </div>

                            {/* Content - positioned at bottom-left */}
                            <div className="relative flex h-full flex-col justify-end px-5 pb-12 sm:px-8 sm:pb-14 md:px-10">
                                {index === active && (
                                    <div
                                        key={active}
                                        className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-lg"
                                    >
                                        <h2 className="text-xl font-bold leading-snug text-white line-clamp-2 sm:text-2xl md:text-3xl drop-shadow-md">
                                            {banner.title ?? t("hero.defaultTitle")}
                                        </h2>
                                        <p className="mt-2 text-sm leading-relaxed text-white/80 line-clamp-2 sm:text-base max-w-xs md:max-w-sm">
                                            {banner.subtitle ?? t("hero.defaultSubtitle")}
                                        </p>
                                        {banner.cta && banner.cta.payload && (
                                            <Link
                                                href={banner.cta.payload || "/promos"}
                                                target="_blank"
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-md transition-all duration-200 hover:bg-white/90 hover:shadow-lg hover:gap-2.5 active:scale-95"
                                                tabIndex={index !== active ? -1 : 0}
                                                onTouchStart={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                {t("hero.cta")}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Arrow Navigation - visible on hover */}
            {slides.length > 1 && (
                <>
                    <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-2 sm:pl-3">
                        <button
                            type="button"
                            onClick={prev}
                            aria-label={t("hero.prev")}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white/30 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:opacity-100"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-2 sm:pr-3">
                        <button
                            type="button"
                            onClick={next}
                            aria-label={t("hero.next")}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white/30 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:opacity-100"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Progress-style indicators */}
                    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-md sm:bottom-4">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goTo(i)}
                                className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
                                style={{ width: i === active ? 24 : 8 }}
                                aria-label={`Go to slide ${i + 1}`}
                            >
                                <span className="absolute inset-0 rounded-full bg-white/40" />
                                {i === active && (
                                    <span
                                        className="absolute inset-0 rounded-full bg-white origin-left animate-[progress_6s_linear]"
                                        key={`progress-${active}`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}