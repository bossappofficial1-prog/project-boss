import { useEffect, useRef } from "react"

export function DivXScroll({ children, className, ...props }: { children: React.ReactNode, className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return
            e.preventDefault()

            el.scrollLeft += e.deltaY * 2
        }

        el.addEventListener("wheel", onWheel, { passive: false })

        return () => el.removeEventListener("wheel", onWheel)
    }, [])
    return <div
        ref={containerRef}
        style={{ scrollBehavior: "smooth" }}
        className={`flex overflow-x-auto overflow-y-hidden scrollbar-hide ${className}`}
    >{children}</div>
}