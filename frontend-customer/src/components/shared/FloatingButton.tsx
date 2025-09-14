"use client";
import { useState, useEffect } from "react";

export default function FloatingButton({ children }: { children: React.ReactNode }) {
    const [pos, setPos] = useState<{ x: number, y: number }>(() => {
        const last = localStorage.getItem("last_position_floating")
        if (last) {
            const [x, y] = JSON.parse(last)
            return { x, y }
        }

        return { x: 340, y: 713 }
    });
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const snapToEdge = (x: number, y: number) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const btnSize = 56;
        const padding = 16;

        // Calculate center positions
        const centerX = x + btnSize / 2;
        const centerY = y + btnSize / 2;

        // Calculate distances to each edge from center
        const toLeft = centerX;
        const toRight = vw - centerX;
        const toTop = centerY;
        const toBottom = vh - centerY;

        // Find minimum distance
        const minDist = Math.min(toLeft, toRight, toTop, toBottom);

        // Snap to the closest edge
        if (minDist === toLeft) {
            localStorage.setItem("last_position_floating", `[${padding}, ${Math.max(padding, Math.min(y, vh - btnSize - padding))}]`)
            return { x: padding, y: Math.max(padding, Math.min(y, vh - btnSize - padding)) };
        } else if (minDist === toRight) {
            localStorage.setItem("last_position_floating", `[${vw - btnSize - padding}, ${Math.max(padding, Math.min(y, vh - btnSize - padding))}]`)
            return { x: vw - btnSize - padding, y: Math.max(padding, Math.min(y, vh - btnSize - padding)) };
        } else if (minDist === toTop) {
            localStorage.setItem("last_position_floating", `[${Math.max(padding, Math.min(x, vw - btnSize - padding))}, ${padding}]`)
            return { x: Math.max(padding, Math.min(x, vw - btnSize - padding)), y: padding };
        } else {
            localStorage.setItem("last_position_floating", `[${Math.max(padding, Math.min(x, vw - btnSize - padding))}, ${vh - btnSize - padding}]`)
            return { x: Math.max(padding, Math.min(x, vw - btnSize - padding)), y: vh - btnSize - padding };
        }
    };

    const handleStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>): void => {
        // Get coordinates from mouse or touch
        const clientX = 'touches' in e && e.touches && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e && e.touches && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        // Store starting position to detect if it's a drag or click
        setStartPos({ x: clientX, y: clientY });
        setHasMoved(false);
        setIsDragging(true);

        const startX = clientX - pos.x;
        const startY = clientY - pos.y;

        const handleMove = (ev: MouseEvent | TouchEvent): void => {
            const moveX = 'touches' in ev && (ev as TouchEvent).touches && (ev as TouchEvent).touches.length > 0
                ? (ev as TouchEvent).touches[0].clientX
                : (ev as MouseEvent).clientX;
            const moveY = 'touches' in ev && (ev as TouchEvent).touches && (ev as TouchEvent).touches.length > 0
                ? (ev as TouchEvent).touches[0].clientY
                : (ev as MouseEvent).clientY;

            // Check if user has moved more than 5px to determine if it's a drag
            const deltaX = Math.abs(moveX - startPos.x);
            const deltaY = Math.abs(moveY - startPos.y);

            if (deltaX > 5 || deltaY > 5) {
                setHasMoved(true);
                ev.preventDefault(); // Only prevent default when actually dragging
            }

            const newX = moveX - startX;
            const newY = moveY - startY;

            // Keep within viewport bounds
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const btnSize = 56;
            const padding = 16;

            const clampedX = Math.max(padding, Math.min(newX, vw - btnSize - padding));
            const clampedY = Math.max(padding, Math.min(newY, vh - btnSize - padding));

            setPos({ x: clampedX, y: clampedY });
        };

        const handleEnd = (): void => {
            setIsDragging(false);

            // Only snap to edge if user actually dragged
            if (hasMoved) {
                setPos(prev => snapToEdge(prev.x, prev.y));
            }

            // Remove both mouse and touch listeners
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };

        // Add both mouse and touch listeners
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setPos(prev => snapToEdge(prev.x, prev.y));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[999]">
            <div
                className={`
                    absolute w-fit rounded-full shadow-lg pointer-events-auto
                    bg-gradient-to-br 
                    flex items-center justify-center
                    cursor-grab active:cursor-grabbing touch-none
                    select-none user-select-none
                    transform-gpu will-change-transform
                    ${isDragging && hasMoved ? 'scale-110 shadow-xl' : 'scale-100'}
                    transition-all duration-300 ease-out
                    hover:scale-105
                `}
                style={{
                    left: pos.x,
                    top: pos.y,
                    transition: isDragging && hasMoved ? 'transform 0.2s ease' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                onClick={(e) => {
                    if (hasMoved) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                {children}
                {isDragging && hasMoved && (
                    <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
                )}
            </div>
        </div>
    );
}