import { useState, useRef, useEffect, useCallback, type TouchEvent as ReactTouchEvent } from "react"

interface UseCarouselProps {
    count: number
    autoplay?: boolean
    autoplayInterval?: number
}

export function useCarousel({ count, autoplay = true, autoplayInterval = 6000 }: UseCarouselProps) {
    const [active, setActive] = useState(0)
    const [isInteracting, setIsInteracting] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const dragOffset = useRef(0)
    const touchStartX = useRef(0)
    const autoplayTimeout = useRef<NodeJS.Timeout | null>(null)
    const interactionTimeout = useRef<NodeJS.Timeout | null>(null)

    const goTo = useCallback(
        (index: number) => {
            if (count > 0) {
                setActive((index + count) % count)
            }
        },
        [count]
    )

    const next = useCallback(() => goTo(active + 1), [active, goTo])
    const prev = useCallback(() => goTo(active - 1), [active, goTo])

    const startInteraction = useCallback(() => {
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current)
        if (autoplayTimeout.current) clearTimeout(autoplayTimeout.current)
        setIsInteracting(true)
    }, [])

    const endInteraction = useCallback(() => {
        if (interactionTimeout.current) clearTimeout(interactionTimeout.current)
        interactionTimeout.current = setTimeout(() => setIsInteracting(false), 2000)
    }, [])

    // Autoplay logic
    useEffect(() => {
        if (!autoplay || isInteracting || isDragging || count <= 1) {
            if (autoplayTimeout.current) clearTimeout(autoplayTimeout.current)
            return
        }

        autoplayTimeout.current = setTimeout(next, autoplayInterval)

        return () => {
            if (autoplayTimeout.current) clearTimeout(autoplayTimeout.current)
        }
    }, [active, isInteracting, isDragging, autoplay, autoplayInterval, next, count])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isInteracting) {
                if (e.key === "ArrowLeft") {
                    startInteraction()
                    prev()
                    endInteraction()
                } else if (e.key === "ArrowRight") {
                    startInteraction()
                    next()
                    endInteraction()
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isInteracting, prev, next, startInteraction, endInteraction])

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (autoplayTimeout.current) clearTimeout(autoplayTimeout.current)
            if (interactionTimeout.current) clearTimeout(interactionTimeout.current)
        }
    }, [])

    const handleTouchStart = (e: ReactTouchEvent<HTMLElement>) => {
        if (count <= 1) return
        startInteraction()
        setIsDragging(true)
        touchStartX.current = e.touches[0].clientX
        dragOffset.current = 0
    }

    const handleTouchMove = (e: ReactTouchEvent<HTMLElement>) => {
        if (!isDragging) return
        const currentX = e.touches[0].clientX
        const deltaX = currentX - touchStartX.current
        dragOffset.current = deltaX
        const container = e.currentTarget as HTMLElement
        container.style.setProperty('--slide-offset', `${dragOffset.current}px`)
    }

    const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
        if (!isDragging) return

        const container = e.currentTarget as HTMLElement
        container.style.removeProperty('--slide-offset')

        setIsDragging(false)
        const swipeThreshold = 50 // px

        if (dragOffset.current > swipeThreshold) {
            prev()
        } else if (dragOffset.current < -swipeThreshold) {
            next()
        }

        dragOffset.current = 0
        endInteraction()
    }

    return {
        active,
        isInteracting,
        isDragging,
        goTo,
        next,
        prev,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchEnd,
            onMouseEnter: startInteraction,
            onMouseLeave: endInteraction,
            onFocus: startInteraction, // for buttons
            onBlur: endInteraction,    // for buttons
        },
    }
}