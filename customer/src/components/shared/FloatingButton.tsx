"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Position = { x: number; y: number };

const STORAGE_KEY = "last_position_floating";
const BUTTON_SIZE = 56;
const PADDING = 16;
const DEFAULT_POSITION: Position = { x: 340, y: 713 };

type Bounds = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
};

const getViewportBounds = (): Bounds => {
    if (typeof window === "undefined") {
        const fallbackX = Math.max(PADDING, Math.min(DEFAULT_POSITION.x, 1280 - BUTTON_SIZE - PADDING));
        const fallbackY = Math.max(PADDING, Math.min(DEFAULT_POSITION.y, 720 - BUTTON_SIZE - PADDING));

        return {
            minX: PADDING,
            maxX: fallbackX,
            minY: PADDING,
            maxY: fallbackY,
            width: 1280,
            height: 720,
        } satisfies Bounds;
    }

    const { innerWidth, innerHeight, visualViewport } = window;
    // Respect safe-area insets (camera notches, home indicators) via visual viewport offsets.
    const offsetTop = visualViewport?.offsetTop ?? 0;
    const offsetLeft = visualViewport?.offsetLeft ?? 0;
    const safeRight = Math.max(0, innerWidth - (visualViewport?.width ?? innerWidth) - offsetLeft);
    const safeBottom = Math.max(0, innerHeight - (visualViewport?.height ?? innerHeight) - offsetTop);

    const minX = offsetLeft + PADDING;
    const maxX = Math.max(minX, innerWidth - BUTTON_SIZE - PADDING - safeRight);
    const minY = offsetTop + PADDING;
    const maxY = Math.max(minY, innerHeight - BUTTON_SIZE - PADDING - safeBottom);

    return {
        minX,
        maxX,
        minY,
        maxY,
        width: innerWidth,
        height: innerHeight,
    } satisfies Bounds;
};

const deriveSmartPosition = () => {
    if (typeof window === "undefined") return DEFAULT_POSITION;

    const bounds = getViewportBounds();
    const vw = bounds.width;
    const verticalRange = bounds.maxY - bounds.minY;
    const isPhone = vw < 480;
    const isTablet = vw >= 480 && vw < 1024;

    const avoidBottom = isPhone ? 88 : isTablet ? 72 : 56;
    const targetY = isPhone
        ? bounds.maxY - avoidBottom
        : bounds.minY + verticalRange * (isTablet ? 0.72 : 0.6);

    return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, bounds.maxX - (isPhone ? 0 : 12))),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, targetY)),
    } satisfies Position;
};

export default function FloatingButton({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const storageKey = useMemo(() => `${STORAGE_KEY}:${pathname ?? "/"}`, [pathname]);
    const derivedDefault = useMemo(() => deriveSmartPosition(), [pathname]);
    const readInitial = useCallback(() => {
        if (typeof window === "undefined") {
            return derivedDefault;
        }

        const stored = window.localStorage.getItem(storageKey);
        if (!stored) {
            return derivedDefault;
        }

        try {
            const [x, y] = JSON.parse(stored);
            if (typeof x === "number" && typeof y === "number") {
                return { x, y };
            }
        } catch (error) {
            console.warn("Invalid floating button position found", error);
        }

        return derivedDefault;
    }, [derivedDefault, storageKey]);

    const [pos, setPos] = useState<Position>(() => readInitial());
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const startPosRef = useRef({ x: 0, y: 0 });
    const hasMovedRef = useRef(false);

    const snapToEdge = useCallback((x: number, y: number): Position => {
        if (typeof window === "undefined") {
            return { x, y };
        }

        const bounds = getViewportBounds();
        const clampX = Math.max(bounds.minX, Math.min(x, bounds.maxX));
        const clampY = Math.max(bounds.minY, Math.min(y, bounds.maxY));
        const centerX = clampX + BUTTON_SIZE / 2;
        const centerY = clampY + BUTTON_SIZE / 2;

        const leftCenter = bounds.minX + BUTTON_SIZE / 2;
        const rightCenter = bounds.maxX + BUTTON_SIZE / 2;
        const topCenter = bounds.minY + BUTTON_SIZE / 2;
        const bottomCenter = bounds.maxY + BUTTON_SIZE / 2;

        const candidates = [
            { edge: "left" as const, distance: Math.abs(centerX - leftCenter) },
            { edge: "right" as const, distance: Math.abs(centerX - rightCenter) },
            { edge: "top" as const, distance: Math.abs(centerY - topCenter) },
            { edge: "bottom" as const, distance: Math.abs(centerY - bottomCenter) },
        ];

        const preferBottom = bounds.width < 640;
        let target = candidates.sort((a, b) => a.distance - b.distance)[0];

        if (preferBottom) {
            const bottomCandidate = candidates.find((candidate) => candidate.edge === "bottom");
            if (bottomCandidate && bottomCandidate !== target && bottomCandidate.distance - target.distance <= 32) {
                target = bottomCandidate;
            }
        }

        let next: Position;
        if (target.edge === "left") {
            next = { x: bounds.minX, y: clampY };
        } else if (target.edge === "right") {
            next = { x: bounds.maxX, y: clampY };
        } else if (target.edge === "top") {
            next = { x: clampX, y: bounds.minY };
        } else {
            next = { x: clampX, y: bounds.maxY };
        }

        window.localStorage.setItem(storageKey, JSON.stringify([next.x, next.y]));
        return next;
    }, [storageKey]);

    const handleStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const clientX = "touches" in e && e.touches?.length
            ? e.touches[0].clientX
            : (e as React.MouseEvent).clientX;
        const clientY = "touches" in e && e.touches?.length
            ? e.touches[0].clientY
            : (e as React.MouseEvent).clientY;

        startPosRef.current = { x: clientX, y: clientY };
        hasMovedRef.current = false;
        setHasMoved(false);
        setIsDragging(true);

        const startX = clientX - pos.x;
        const startY = clientY - pos.y;

        const handleMove = (ev: MouseEvent | TouchEvent) => {
            const moveX = "touches" in ev && (ev as TouchEvent).touches?.length
                ? (ev as TouchEvent).touches[0].clientX
                : (ev as MouseEvent).clientX;
            const moveY = "touches" in ev && (ev as TouchEvent).touches?.length
                ? (ev as TouchEvent).touches[0].clientY
                : (ev as MouseEvent).clientY;

            const deltaX = Math.abs(moveX - startPosRef.current.x);
            const deltaY = Math.abs(moveY - startPosRef.current.y);

            if (deltaX > 5 || deltaY > 5) {
                if (!hasMovedRef.current) {
                    hasMovedRef.current = true;
                    setHasMoved(true);
                }
                ev.preventDefault();
            }

            if (typeof window === "undefined") return;

            const bounds = getViewportBounds();
            const clampedX = Math.max(bounds.minX, Math.min(moveX - startX, bounds.maxX));
            const clampedY = Math.max(bounds.minY, Math.min(moveY - startY, bounds.maxY));

            setPos({ x: clampedX, y: clampedY });
        };

        const handleEnd = () => {
            setIsDragging(false);

            if (hasMovedRef.current) {
                setPos((prev) => snapToEdge(prev.x, prev.y));
            }

            hasMovedRef.current = false;
            setHasMoved(false);

            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseup", handleEnd);
            document.removeEventListener("touchmove", handleMove);
            document.removeEventListener("touchend", handleEnd);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleEnd);
        document.addEventListener("touchmove", handleMove, { passive: false });
        document.addEventListener("touchend", handleEnd);
    }, [pos.x, pos.y, snapToEdge]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const next = readInitial();
        setPos((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
    }, [readInitial]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setPos((prev) => {
                const bounds = getViewportBounds();
                const clampedX = Math.max(bounds.minX, Math.min(prev.x, bounds.maxX));
                const clampedY = Math.max(bounds.minY, Math.min(prev.y, bounds.maxY));

                if (Math.abs(clampedX - prev.x) < 1 && Math.abs(clampedY - prev.y) < 1) {
                    return prev;
                }

                return { x: clampedX, y: clampedY };
            });
        };

        window.addEventListener("resize", handleResize);
        window.visualViewport?.addEventListener("resize", handleResize);
        window.visualViewport?.addEventListener("scroll", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.visualViewport?.removeEventListener("resize", handleResize);
            window.visualViewport?.removeEventListener("scroll", handleResize);
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        setPos((prev) => {
            const bounds = getViewportBounds();
            const withinX = prev.x >= bounds.minX && prev.x <= bounds.maxX;
            const withinY = prev.y >= bounds.minY && prev.y <= bounds.maxY;

            if (withinX && withinY) {
                return prev;
            }

            return snapToEdge(derivedDefault.x, derivedDefault.y);
        });
    }, [derivedDefault, snapToEdge]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[999]">
            <div
                className={`
                    absolute w-fit pointer-events-auto
                    rounded-full border border-border/20
                    shadow-[0_16px_28px_-14px_rgba(15,23,42,0.4)]
                    flex items-center gap-2.5
                    cursor-grab active:cursor-grabbing touch-none
                    select-none user-select-none
                    transform-gpu will-change-transform
                    transition-all duration-300 ease-out
                    hover:-translate-y-[3px] hover:shadow-[0_20px_36px_-14px_rgba(15,23,42,0.45)]
                    focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    ${isDragging && hasMoved ? "scale-[1.05]" : "scale-100"}
                    ${isHovered && !isDragging ? "opacity-100" : "opacity-95 md:opacity-90"}
                `}
                style={{
                    left: pos.x,
                    top: pos.y,
                    transition: isDragging && hasMoved ? "transform 0.16s ease" : "all 0.32s cubic-bezier(0.33, 1, 0.68, 1)",
                }}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    if (hasMoved) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                {children}
                {isDragging && hasMoved && (
                    <div className="absolute inset-0 rounded-2xl animate-ping" />
                )}
            </div>
        </div>
    );
}