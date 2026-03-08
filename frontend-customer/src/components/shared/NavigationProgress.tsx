"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressLogic() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = useCallback(() => {
        setVisible(true);
        setProgress(0);
        if (timerRef.current) clearInterval(timerRef.current);

        let p = 0;
        timerRef.current = setInterval(() => {
            if (p < 60) p += Math.random() * 15 + 5;
            else if (p < 85) p += Math.random() * 3 + 1;
            else if (p < 95) p += 0.5;
            setProgress(Math.min(p, 95));
        }, 150);
    }, []);

    const done = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setProgress(100);
        setTimeout(() => {
            setVisible(false);
            // Reset ke 0 setelah animasi fade-out selesai
            setTimeout(() => setProgress(0), 400);
        }, 300);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a") as HTMLAnchorElement;
            if (!anchor || !anchor.href) return;

            const targetUrl = new URL(anchor.href);
            const currentUrl = new URL(window.location.href);

            // Cek apakah ini navigasi internal dan bukan ke hash yang sama
            const isInternal = targetUrl.origin === currentUrl.origin;
            const isSamePage = targetUrl.pathname === currentUrl.pathname &&
                targetUrl.search === currentUrl.search;
            const isDownload = anchor.hasAttribute("download");
            const isNewTab = anchor.target === "_blank";

            if (isInternal && !isSamePage && !isDownload && !isNewTab) {
                start();
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [start]);

    useEffect(() => {
        done();
    }, [pathname, searchParams, done]);

    if (!visible && progress === 0) return null;

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                height: "3px",
                pointerEvents: "none",
                backgroundColor: "transparent",
            }}
        >
            <div
                style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #eb2525, #ff6b6b)",
                    transition: "width 0.3s ease-out, opacity 0.3s ease-in-out",
                    opacity: visible ? 1 : 0,
                    boxShadow: "0 0 8px rgba(235,37,37,0.4)",
                }}
            />
        </div>
    );
}

export function NavigationProgress() {
    return (
        <Suspense fallback={null}>
            <ProgressLogic />
        </Suspense>
    );
}