'use client'

import React, { useEffect, useState } from "react";
import LoadingEffect from "@/components/shared/LoadingEffect";
import dynamic from 'next/dynamic';

// Dynamically load the onboarding modal to avoid pulling heavy animation/icons
// libraries into the initial bundle.
const OnboardingModal = dynamic(() => import('../onboarding/OnboardingModal'), { ssr: false, loading: () => null });

// Dynamically load PWA Install Prompt
const PWAInstallPrompt = dynamic(() => import('../PWAInstallPrompt'), { ssr: false, loading: () => null });

// Dynamically load Online Status Indicator
const OnlineStatusIndicator = dynamic(() => import('../OnlineStatusIndicator'), { ssr: false, loading: () => null });

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
    // Keep loading disabled by default to avoid render-blocking overlay
    // which hurts LCP in Lighthouse. If you need a loading overlay, prefer
    // a lightweight skeleton or show it only for specific async actions.
    const [loading, setLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // onboarding: show once per browser unless user already saw it.
        // Delay showing slightly so LCP isn't affected by modal/animations.
        let mounted = true;
        try {
            const seen = localStorage.getItem("hasSeenOnboarding");
            if (!seen) {
                const id = setTimeout(() => {
                    if (mounted) setShowOnboarding(true);
                }, 1500);
                return () => {
                    mounted = false;
                    clearTimeout(id);
                };
            }
        } catch {
            const id = setTimeout(() => {
                if (mounted) setShowOnboarding(true);
            }, 1500);
            return () => {
                mounted = false;
                clearTimeout(id);
            };
        }
    }, []);

    // removed waiting for window.load so the page can render quickly and
    // avoid a render-blocking overlay that negatively impacts LCP.

    const defaultFallback = (
        // keep a minimal fallback markup for API compatibility; not shown by default
        <div aria-live="polite" role="status" style={{ position: 'absolute', top: 0, left: 0 }}>
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
            <div className="bg-[var(--bg)] text-[var(--fg)]">
                {children}
            </div>

            {/* loading overlay is disabled by default to improve LCP. */}

            {/* onboarding modal shown after initial load (or you can show immediately by removing !loading) */}
            {!loading && (
                <OnboardingModal
                    open={showOnboarding}
                    onComplete={handleCompleteOnboarding}
                    onClose={handleCloseOnboarding}
                />
            )}

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />

            {/* Online Status Indicator */}
            <OnlineStatusIndicator />
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