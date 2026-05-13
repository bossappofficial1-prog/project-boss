"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GuideStep, useFeatureGuideContext } from "@/providers/FeatureGuideProvider";
import { useTheme } from "next-themes";

const HIGHLIGHT_PADDING = 14;
const DEFAULT_OFFSET = 24;
const GUIDE_ACCENT = "#F04C35";
const GUIDE_ACCENT_MUTED = "rgba(240, 76, 53, 0.18)";

type CardSize = { width: number; height: number };

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function computeTooltipPosition(
    rect: DOMRect,
    step: GuideStep,
    card: CardSize,
): React.CSSProperties {
    const placement = step.placement ?? "top";
    const offset = step.offset ?? DEFAULT_OFFSET;
    const margin = 16;
    const cardWidth = card.width || Math.min(window.innerWidth * 0.92, 360);
    const cardHeight = card.height || 220;

    if (placement === "bottom") {
        return {
            top: clamp(rect.bottom + offset, margin, window.innerHeight - margin - cardHeight),
            left: clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, window.innerWidth - margin - cardWidth),
        };
    }
    if (placement === "left") {
        return {
            top: clamp(rect.top + rect.height / 2 - cardHeight / 2, margin, window.innerHeight - margin - cardHeight),
            left: clamp(rect.left - offset - cardWidth, margin, window.innerWidth - margin - cardWidth),
        };
    }
    if (placement === "right") {
        return {
            top: clamp(rect.top + rect.height / 2 - cardHeight / 2, margin, window.innerHeight - margin - cardHeight),
            left: clamp(rect.right + offset, margin, window.innerWidth - margin - cardWidth),
        };
    }
    return {
        top: clamp(rect.top - offset - cardHeight, margin, window.innerHeight - margin - cardHeight),
        left: clamp(rect.left + rect.width / 2 - cardWidth / 2, margin, window.innerWidth - margin - cardWidth),
    };
}

function clampHighlight(rect: DOMRect, padding: number) {
    return {
        top: Math.max(rect.top - padding, 8),
        left: Math.max(rect.left - padding, 8),
        width: Math.min(rect.width + padding * 2, window.innerWidth - 16),
        height: Math.min(rect.height + padding * 2, window.innerHeight - 16),
    };
}

function useTargetRect(step: GuideStep | null) {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [retryToken, setRetryToken] = useState(0);
    const frameRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        if (!step) { setRect(null); return; }

        const element = document.querySelector(step.target) as HTMLElement | null;
        if (!element) {
            const id = window.setTimeout(() => setRetryToken((t) => t + 1), 300);
            return () => window.clearTimeout(id);
        }

        const update = () => setRect(element.getBoundingClientRect());
        const scheduleUpdate = () => {
            if (frameRef.current !== null) return;
            frameRef.current = window.requestAnimationFrame(() => {
                frameRef.current = null;
                update();
            });
        };

        update();
        const ro = new ResizeObserver(scheduleUpdate);
        ro.observe(element);
        const mo = new MutationObserver(scheduleUpdate);
        mo.observe(element, { attributes: true, childList: true, subtree: true });
        window.addEventListener("resize", scheduleUpdate);
        window.addEventListener("scroll", scheduleUpdate, true);

        return () => {
            ro.disconnect();
            mo.disconnect();
            window.removeEventListener("resize", scheduleUpdate);
            window.removeEventListener("scroll", scheduleUpdate, true);
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [retryToken, step]);

    return rect;
}

/* ─── Step Number Badge ─────────────────────────────────────── */
function StepBadge({ current, total, isDark }: { current: number; total: number; isDark: boolean }) {
    return (
        <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
                background: isDark ? "rgba(240,76,53,0.15)" : "rgba(240,76,53,0.08)",
                border: `1px solid ${isDark ? "rgba(240,76,53,0.3)" : "rgba(240,76,53,0.2)"}`,
            }}
        >
            <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: GUIDE_ACCENT }}
            >
                {current}
            </span>
            <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: isDark ? "rgba(240,76,53,0.85)" : GUIDE_ACCENT }}
            >
                dari {total}
            </span>
        </div>
    );
}

/* ─── Dot Indicators ────────────────────────────────────────── */
function DotIndicators({
    steps,
    activeId,
    isDark,
}: {
    steps: GuideStep[];
    activeId: string;
    isDark: boolean;
}) {
    return (
        <div className="flex items-center gap-1.5">
            {steps.map((s) => {
                const isActive = s.id === activeId;
                return (
                    <span
                        key={s.id}
                        className="rounded-full transition-all duration-300"
                        style={{
                            width: isActive ? 20 : 6,
                            height: 6,
                            backgroundColor: isActive
                                ? GUIDE_ACCENT
                                : isDark
                                    ? "rgba(240,76,53,0.25)"
                                    : "rgba(240,76,53,0.18)",
                        }}
                    />
                );
            })}
        </div>
    );
}

/* ─── Close Button ─────────────────────────────────────────── */
function CloseButton({ onClick, isDark }: { onClick: () => void; isDark: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Tutup panduan"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F04C35] focus-visible:ring-offset-2"
            style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDark
                    ? "rgba(240,76,53,0.2)"
                    : "rgba(240,76,53,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = GUIDE_ACCENT;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)";
                (e.currentTarget as HTMLButtonElement).style.color = isDark
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(0,0,0,0.35)";
            }}
        >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        </button>
    );
}

/* ─── Main Component ────────────────────────────────────────── */
export function FeatureGuideOverlay() {
    const { state, nextStep, prevStep, skipGuide } = useFeatureGuideContext();
    const { resolvedTheme } = useTheme();

    const step = useMemo(() => {
        if (!state.activeGuideId) return null;
        return state.steps[state.stepIndex] ?? null;
    }, [state]);

    const rect = useTargetRect(step);
    const [mounted, setMounted] = useState(false);
    const [cardSize, setCardSize] = useState<CardSize>({ width: 0, height: 0 });
    const cardRef = useRef<HTMLDivElement | null>(null);
    const isDark = (resolvedTheme ?? "light") === "dark";

    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    useLayoutEffect(() => {
        if (!mounted) return;
        const node = cardRef.current;
        if (!node) return;

        const update = () => setCardSize({ width: node.offsetWidth, height: node.offsetHeight });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(node);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, [mounted, step]);

    useEffect(() => { if (mounted && step) cardRef.current?.focus(); }, [mounted, step]);

    useEffect(() => {
        if (!step) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") { e.preventDefault(); skipGuide(); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); prevStep(); }
            else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); nextStep(); }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [nextStep, prevStep, skipGuide, step]);

    if (!mounted || !step) return null;

    const totalSteps = state.steps.length;
    const isLastStep = state.stepIndex + 1 === totalSteps;
    const progress = totalSteps ? Math.round(((state.stepIndex + 1) / totalSteps) * 100) : 0;
    const titleId = `fgt-${step.id}`;
    const descId = `fgd-${step.id}`;
    const highlightPadding = step.focusPadding ?? HIGHLIGHT_PADDING;
    const highlightBounds = rect ? clampHighlight(rect, highlightPadding) : null;

    const tooltipStyle = rect
        ? computeTooltipPosition(rect, step, cardSize)
        : {
            top: clamp(window.innerHeight / 2 - (cardSize.height || 200) / 2, 16, window.innerHeight - 232),
            left: clamp(window.innerWidth / 2 - (cardSize.width || 320) / 2, 16, window.innerWidth - 376),
        };

    /* ── Glassmorphism card styles ── */
    const cardStyle: React.CSSProperties = isDark
        ? {
            background: "rgba(15,20,35,0.88)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }
        : {
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 24px 60px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.8) inset",
        };

    const overlay = (
        <>
            {/* Global animation styles */}
            <style>{`
                @keyframes fg-fade-in {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes fg-pulse-ring {
                    0%   { transform: scale(1); opacity: 0.6; }
                    70%  { transform: scale(1.06); opacity: 0; }
                    100% { transform: scale(1.06); opacity: 0; }
                }
                .fg-card-enter { animation: fg-fade-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
                .fg-highlight-ring { animation: fg-pulse-ring 2.4s ease-out infinite; }
            `}</style>

            <div className="pointer-events-none fixed inset-0 z-[999]">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 pointer-events-auto transition-opacity duration-300"
                    style={{ background: isDark ? "rgba(5,8,20,0.72)" : "rgba(15,23,42,0.48)" }}
                    role="presentation"
                    aria-hidden="true"
                    onClick={skipGuide}
                />

                {/* Highlight cutout with animated ring */}
                {highlightBounds && (
                    <>
                        {/* Pulsing ring behind highlight */}
                        <div
                            aria-hidden="true"
                            className="fg-highlight-ring pointer-events-none fixed rounded-[28px]"
                            style={{
                                top: highlightBounds.top - 4,
                                left: highlightBounds.left - 4,
                                width: highlightBounds.width + 8,
                                height: highlightBounds.height + 8,
                                border: `2px solid ${GUIDE_ACCENT}`,
                                opacity: 0.4,
                            }}
                        />
                        {/* Main highlight border */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none fixed rounded-[24px]"
                            style={{
                                top: highlightBounds.top,
                                left: highlightBounds.left,
                                width: highlightBounds.width,
                                height: highlightBounds.height,
                                boxShadow: `0 0 0 9999px ${isDark ? "rgba(5,8,20,0.72)" : "rgba(15,23,42,0.48)"}`,
                                border: `2px solid ${isDark ? "rgba(240,76,53,0.55)" : "rgba(240,76,53,0.45)"}`,
                                outline: `4px solid ${isDark ? "rgba(240,76,53,0.12)" : "rgba(240,76,53,0.08)"}`,
                                outlineOffset: 4,
                            }}
                        />
                    </>
                )}

                {/* Tooltip Card */}
                <div
                    ref={cardRef}
                    tabIndex={-1}
                    key={step.id}
                    className="fg-card-enter pointer-events-auto fixed w-[min(92vw,360px)] rounded-3xl p-5 backdrop-blur-xl focus:outline-none"
                    style={{ ...tooltipStyle, ...cardStyle }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={descId}
                    aria-live="polite"
                >
                    {/* Accent top bar */}
                    <div
                        className="absolute left-5 right-5 top-0 h-[2px] rounded-full"
                        style={{ background: `linear-gradient(90deg, ${GUIDE_ACCENT}, transparent ${progress}%, transparent)` }}
                        aria-hidden="true"
                    />

                    {/* Header row */}
                    <header className="flex items-start justify-between gap-3 pt-1">
                        <StepBadge current={state.stepIndex + 1} total={totalSteps} isDark={isDark} />
                        <CloseButton onClick={skipGuide} isDark={isDark} />
                    </header>

                    {/* Content */}
                    <div className="mt-3.5 space-y-1.5">
                        <h3
                            id={titleId}
                            className="text-[15px] font-bold leading-snug tracking-[-0.01em]"
                            style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
                        >
                            {step.title}
                        </h3>
                        <p
                            id={descId}
                            className="text-[13px] leading-relaxed"
                            style={{ color: isDark ? "rgba(226,232,240,0.72)" : "rgba(51,65,85,0.8)" }}
                        >
                            {step.description}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div
                        className="mt-4 h-1 w-full overflow-hidden rounded-full"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-label="Progress panduan"
                    >
                        <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${GUIDE_ACCENT}, #ff7a66)`,
                            }}
                        />
                    </div>

                    {/* Footer row */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                        {/* Back button */}
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={state.stepIndex === 0}
                            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-150 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F04C35] focus-visible:ring-offset-1"
                            style={
                                state.stepIndex === 0
                                    ? {
                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                                        color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                                    }
                                    : {
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                        color: isDark ? "rgba(226,232,240,0.85)" : "rgba(51,65,85,0.85)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                    }
                            }
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Kembali
                        </button>

                        {/* Dot indicators */}
                        <DotIndicators steps={state.steps} activeId={step.id} isDark={isDark} />

                        {/* Next / Done button */}
                        <button
                            type="button"
                            onClick={nextStep}
                            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold text-white shadow-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F04C35] focus-visible:ring-offset-1"
                            style={{
                                background: `linear-gradient(135deg, ${GUIDE_ACCENT} 0%, #d93d28 100%)`,
                                boxShadow: `0 4px 14px rgba(240,76,53,0.35)`,
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px rgba(240,76,53,0.48)`;
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px rgba(240,76,53,0.35)`;
                            }}
                        >
                            {isLastStep ? "Selesai" : "Lanjut"}
                            {!isLastStep && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            {isLastStep && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Keyboard hint */}
                    <p
                        className="mt-3 text-center text-[11px]"
                        style={{ color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)" }}
                    >
                        ← → Enter untuk navigasi &nbsp;·&nbsp; Esc untuk tutup
                    </p>
                </div>
            </div>
        </>
    );

    return mounted ? createPortal(overlay, document.body) : null;
}