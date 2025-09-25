"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageRender } from "@/components/shared/Image"
import { useTranslations } from "@/hooks/useI18n"
import type { HomeBanner } from "@/types/home"

interface HeroCarouselProps {
    banners: HomeBanner[]
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
    const slides = useMemo(() => banners.filter(Boolean), [banners])
    const [active, setActive] = useState(0)
    const t = useTranslations("homePage")

    useEffect(() => {
        if (slides.length <= 1) return
        const interval = setInterval(() => {
            setActive((prev) => (prev + 1) % slides.length)
        }, 6000)

        return () => clearInterval(interval)
    }, [slides.length])

    const goTo = (index: number) => {
        if (!slides.length) return
        setActive((index + slides.length) % slides.length)
    }

    if (slides.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8 text-primary">
                <div className="max-w-xl space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-wide">{t("hero.badge")}</p>
                    <h2 className="text-2xl font-bold leading-tight">{t("hero.fallbackTitle")}</h2>
                    <p className="text-sm text-primary/70">{t("hero.fallbackSubtitle")}</p>
                </div>
            </div>
        )
    }

    const current = slides[active]

    return (
        <div className="relative overflow-hidden rounded-3xl border border-border/40 shadow-sm">
            {slides.map((banner, index) => {
                const heading = banner.title ?? t("hero.defaultTitle")
                const description = banner.subtitle ?? t("hero.defaultSubtitle")
                const ctaHref = banner.cta
                    ? banner.cta.type === 'url'
                        ? banner.cta.payload || '/promos'
                        : banner.cta.type === 'outlet'
                            ? `/outlet/${banner.cta.payload}`
                            : banner.cta.payload || '/promos'
                    : undefined

                return (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-all duration-700 ease-out ${index === active ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
                    >
                        <div className="absolute inset-0">
                            <ImageRender
                                src={banner.imageUrl}
                                alt={banner.title ?? "Banner"}
                                className="h-full w-full object-cover"
                                sizes="100vw"
                                priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
                        </div>
                        <div className="relative flex min-h-[220px] flex-col justify-center gap-3 p-8 text-white">
                            <p className="text-sm font-semibold uppercase tracking-wider text-white/70">{t("hero.badge")}</p>
                            <h2 className="text-2xl font-bold leading-tight md:text-3xl">{heading}</h2>
                            <p className="max-w-xl text-sm md:text-base text-white/80 leading-relaxed">{description}</p>
                            {ctaHref && (
                                <Link href={ctaHref}>
                                    <Button size="sm" variant="secondary" className="mt-1 bg-white/90 text-primary hover:bg-white">
                                        {t("hero.cta")}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )
            })}

            {slides.length > 1 && (
                <>
                    <div className="absolute inset-0 flex items-center justify-between p-4">
                        <button
                            type="button"
                            onClick={() => goTo(active - 1)}
                            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur hover:bg-black/60 transition"
                            aria-label={t("hero.prev")}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => goTo(active + 1)}
                            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur hover:bg-black/60 transition"
                            aria-label={t("hero.next")}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
                        {slides.map((_, indicatorIndex) => (
                            <button
                                key={indicatorIndex}
                                type="button"
                                onClick={() => goTo(indicatorIndex)}
                                className={`h-2.5 rounded-full transition-all ${indicatorIndex === active ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                                aria-label={`Pilih banner ${indicatorIndex + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* SSR fallback ensures first slide visible */}
            <div className="relative min-h-[220px]" />
        </div>
    )
}
