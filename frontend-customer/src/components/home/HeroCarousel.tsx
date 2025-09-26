"use client"

import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react"
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
    const [isInteracting, setIsInteracting] = useState(false)
    const t = useTranslations("homePage")
    const touchState = useRef<{ startX: number | null; startY: number | null; deltaX: number; isSwiping: boolean }>({
        startX: null,
        startY: null,
        deltaX: 0,
        isSwiping: false,
    })
    // Use refs + requestAnimationFrame for smooth, direct DOM transforms during touch drag
    const slideRefs = useRef<Array<HTMLDivElement | null>>([])
    const rafRef = useRef<number | null>(null)
    const dragOffsetRef = useRef(0)
    const hideNavTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showNavigation = () => {
        if (hideNavTimeout.current) {
            clearTimeout(hideNavTimeout.current)
            hideNavTimeout.current = null
        }
        setIsInteracting(true)
    }

    const resetTouchState = () => {
        touchState.current = {
            startX: null,
            startY: null,
            deltaX: 0,
            isSwiping: false,
        }
        dragOffsetRef.current = 0
        // ensure current active slide style is cleared
        const el = slideRefs.current[active]
        if (el) {
            el.style.transition = ''
            el.style.transform = ''
        }
        // clear neighbors
        const prevEl2 = slideRefs.current[(active - 1 + slides.length) % slides.length]
        const nextEl2 = slideRefs.current[(active + 1) % slides.length]
        if (prevEl2) {
            prevEl2.style.transition = ''
            prevEl2.style.transform = ''
        }
        if (nextEl2) {
            nextEl2.style.transition = ''
            nextEl2.style.transform = ''
        }
    }

    const scheduleHideNav = () => {
        if (hideNavTimeout.current) {
            clearTimeout(hideNavTimeout.current)
        }
        hideNavTimeout.current = setTimeout(() => {
            setIsInteracting(false)
            hideNavTimeout.current = null
        }, 1800)
    }

    useEffect(() => {
        return () => {
            if (hideNavTimeout.current) {
                clearTimeout(hideNavTimeout.current)
            }
        }
    }, [])

    // position slides side-by-side when active changes and cancel RAF on unmount
    useEffect(() => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 0
        slideRefs.current.forEach((el, idx) => {
            if (!el) return
            // base position: each slide is placed horizontally next to each other
            const base = (idx - active) * w
            el.style.transition = 'transform 300ms ease'
            el.style.transform = `translate3d(${base}px, 0, 0)`
            // ensure visibility controlled by transform layout (keep pointer-events none for non-active)
            el.style.opacity = ''
            el.style.pointerEvents = idx === active ? '' : 'none'
            el.style.zIndex = idx === active ? '20' : '10'
        })

        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [active])

    useEffect(() => {
        if (slides.length <= 1 || isInteracting) return
        const interval = setInterval(() => {
            setActive((prev) => (prev + 1) % slides.length)
        }, 6000)

        return () => clearInterval(interval)
    }, [slides.length, isInteracting])

    const goTo = (index: number) => {
        if (!slides.length) return
        setActive(() => (index + slides.length) % slides.length)
    }

    const prev = () => goTo(active - 1)
    const next = () => goTo(active + 1)

    if (slides.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8 text-primary shadow-sm">
                <div className="max-w-xl space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-wide">{t("hero.badge")}</p>
                    <h2 className="text-2xl font-bold leading-tight">{t("hero.fallbackTitle")}</h2>
                    <p className="text-sm text-primary/70">{t("hero.fallbackSubtitle")}</p>
                </div>
            </div>
        )
    }

    const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
        showNavigation()
        const touch = event.touches[0]
        if (!touch) return
        touchState.current.startX = touch.clientX
        touchState.current.startY = touch.clientY
        touchState.current.deltaX = 0
        touchState.current.isSwiping = false
    }

    const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
        if (touchState.current.startX === null || touchState.current.startY === null) return

        const touch = event.touches[0]
        if (!touch) return

        const deltaX = touch.clientX - touchState.current.startX
        const deltaY = touch.clientY - touchState.current.startY

        if (!touchState.current.isSwiping) {
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                touchState.current.isSwiping = true
            } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // user intends to scroll vertically; abort swipe
                setIsInteracting(false)
                resetTouchState()
                return
            }
        }

        if (touchState.current.isSwiping) {
            event.preventDefault()
            touchState.current.deltaX = deltaX
            // Apply a small dampening so the drag feels natural and not too loose
            const dampened = Math.max(-window.innerWidth, Math.min(window.innerWidth, deltaX))
            dragOffsetRef.current = dampened

            // schedule RAF to apply transform to the active slide
            if (rafRef.current == null) {
                rafRef.current = requestAnimationFrame(() => {
                    const offset = dragOffsetRef.current
                    const w = window.innerWidth

                    slideRefs.current.forEach((el, idx) => {
                        if (!el) return
                        // base position each slide: (idx - active) * width
                        const base = (idx - active) * w
                        // apply drag offset to the whole set; neighbors will naturally show
                        el.style.transition = 'none'
                        el.style.transform = `translate3d(${base + offset}px, 0, 0)`
                        // ensure visible during dragging
                        el.style.opacity = '1'
                        // allow interaction only on active to avoid accidental taps
                        el.style.pointerEvents = idx === active ? 'auto' : 'none'
                        el.style.zIndex = idx === active ? '20' : '10'
                    })

                    rafRef.current = null
                })
            }
        }
    }

    const handleTouchEnd = () => {
        if (touchState.current.isSwiping) {
            if (touchState.current.deltaX > 40) {
                goTo(active - 1)
            } else if (touchState.current.deltaX < -40) {
                goTo(active + 1)
            }
        }
        // Animate all slides back to their base positions (idx - active) * width
        const w = typeof window !== 'undefined' ? window.innerWidth : 0
        slideRefs.current.forEach((el, idx) => {
            if (!el) return
            el.style.transition = 'transform 300ms ease'
            const base = (idx - active) * w
            el.style.transform = `translate3d(${base}px, 0, 0)`
            el.style.zIndex = idx === active ? '20' : '10'
            // restore pointer events after settle
            if (idx !== active) el.style.pointerEvents = 'none'

            const cleanup = () => {
                el.style.transition = ''
                el.style.transform = ''
                el.style.opacity = ''
                el.style.pointerEvents = idx === active ? '' : 'none'
                el.style.zIndex = ''
                el.removeEventListener('transitionend', cleanup)
            }
            el.addEventListener('transitionend', cleanup)
        })

        scheduleHideNav()
        resetTouchState()
    }

    const handleTouchCancel = () => {
        scheduleHideNav()
        resetTouchState()
    }

    return (
        <div
            className="relative overflow-hidden rounded-lg border border-border/40 shadow-sm"
            role="region"
            aria-roledescription="carousel"
            aria-live="polite"
            aria-label={t("hero.badge")}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onMouseEnter={showNavigation}
            onMouseLeave={scheduleHideNav}
        >
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
                        ref={(el) => { slideRefs.current[index] = el }}
                        className={`absolute inset-0 ${index === active ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
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
                        <div className="relative flex min-h-[180px] flex-col justify-center gap-3 px-4 py-6 sm:px-6 sm:py-8 text-white">
                            <p className="text-[11px] sm:text-sm font-semibold uppercase tracking-wider text-white/70">{t("hero.badge")}</p>
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold leading-snug line-clamp-2 max-w-full sm:max-w-xl">{heading}</h2>
                            <p className="max-w-full sm:max-w-xl text-xs sm:text-sm md:text-base text-white/80 leading-relaxed line-clamp-3">{description}</p>
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
                    <div
                        className={`absolute inset-0 flex items-center justify-between p-4 transition-opacity duration-200 focus-within:opacity-100 ${isInteracting ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                            }`} style={{ zIndex: 30 }}
                    >
                        <button
                            type="button"
                            onClick={prev}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                            aria-label={t("hero.prev")}
                            onFocus={showNavigation}
                            onBlur={() => scheduleHideNav()}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                            aria-label={t("hero.next")}
                            onFocus={showNavigation}
                            onBlur={() => scheduleHideNav()}
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
