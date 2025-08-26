'use client'

import React, { useEffect, useState } from "react";
import LoadingEffect from "@/components/shared/LoadingEffect";
import OnboardingModal from "../onboarding/OnboardingModal";

type RootLayoutProps = {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    minDuration?: number;
    onLoaded?: () => void;
};

export default function RootLayout({
    children,
    fallback,
    minDuration = 300,
    onLoaded,
}: RootLayoutProps) {
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // onboarding: show once per browser unless user already saw it
        try {
            const seen = localStorage.getItem("hasSeenOnboarding");
            if (!seen) setShowOnboarding(true);
        } catch {
            setShowOnboarding(true);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const startedAt = Date.now();

        const finish = () => {
            const elapsed = Date.now() - startedAt;
            const wait = Math.max(0, minDuration - elapsed);
            setTimeout(() => {
                if (!mounted) return;
                setLoading(false);
                onLoaded?.();
            }, wait);
        };

        if (document.readyState === "complete") {
            finish();
        } else {
            const onLoad = () => finish();
            window.addEventListener("load", onLoad, { once: true });
            return () => {
                mounted = false;
                window.removeEventListener("load", onLoad);
            };
        }

        return () => {
            mounted = false;
        };
    }, [minDuration, onLoaded]);

    const defaultFallback = (
        <div style={overlayStyle} aria-live="polite" role="status">
            <LoadingEffect standalone />
        </div>
    );

    const handleCompleteOnboarding = () => {
        try {
            localStorage.setItem("hasSeenOnboarding", "1");
        } catch { }
        setShowOnboarding(false);
    };

    const handleCloseOnboarding = () => {
        // Only close the modal, don't mark as seen.
        // The user will see it again on next visit unless they complete it.
        setShowOnboarding(false);
    };

    return (
        <div style={{ minHeight: "100vh", position: "relative" }}>
            <div aria-hidden={loading} className="bg-[var(--bg)] text-[var(--fg)]" style={{ filter: loading ? "blur(2px)" : "none", transition: "filter .25s ease" }}>
                {children}
            </div>

            {loading ? (fallback ?? defaultFallback) : null}

            {/* onboarding modal shown after initial load (or you can show immediately by removing !loading) */}
            {!loading && (
                <OnboardingModal
                    open={showOnboarding}
                    onComplete={handleCompleteOnboarding}
                    onClose={handleCloseOnboarding}
                />
            )}
        </div>
    );
}

/* ---------- Inline styles (kept simple so no extra CSS files needed) ---------- */

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.5))",
    zIndex: 9999,
    flexDirection: "column",
};