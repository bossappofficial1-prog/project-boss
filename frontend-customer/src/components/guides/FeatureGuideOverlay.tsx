"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GuideStep, useFeatureGuideContext } from "@/providers/FeatureGuideProvider";
import { useTheme } from "next-themes";

const HIGHLIGHT_PADDING = 16;
const DEFAULT_OFFSET = 20;
const GUIDE_ACCENT = "#F04C35";
const GUIDE_ACCENT_MUTED = "rgba(240, 76, 53, 0.25)";

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
        const top = clamp(
            rect.bottom + offset,
            margin,
            window.innerHeight - margin - cardHeight,
        );
        const left = clamp(
            rect.left + rect.width / 2 - cardWidth / 2,
            margin,
            window.innerWidth - margin - cardWidth,
        );
        return {
            top,
            left,
        };
    }

    if (placement === "left") {
        const left = clamp(
            rect.left - offset - cardWidth,
            margin,
            window.innerWidth - margin - cardWidth,
        );
        const top = clamp(
            rect.top + rect.height / 2 - cardHeight / 2,
            margin,
            window.innerHeight - margin - cardHeight,
        );
        return {
            top,
            left,
        };
    }

    if (placement === "right") {
        const left = clamp(
            rect.right + offset,
            margin,
            window.innerWidth - margin - cardWidth,
        );
        const top = clamp(
            rect.top + rect.height / 2 - cardHeight / 2,
            margin,
            window.innerHeight - margin - cardHeight,
        );
        return {
            top,
            left,
        };
    }

    const top = clamp(
        rect.top - offset - cardHeight,
        margin,
        window.innerHeight - margin - cardHeight,
    );
    const left = clamp(
        rect.left + rect.width / 2 - cardWidth / 2,
        margin,
        window.innerWidth - margin - cardWidth,
    );
    return {
        top,
        left,
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

    useLayoutEffect(() => {
        if (!step) {
            setRect(null);
            return;
        }

        const selector = step.target;
        const element = document.querySelector(selector) as HTMLElement | null;

        if (!element) {
            const id = window.setTimeout(() => setRetryToken((token) => token + 1), 300);
            return () => window.clearTimeout(id);
        }

        const update = () => {
            setRect(element.getBoundingClientRect());
        };

        update();

        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(element);
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);

        const mutationObserver = new MutationObserver(update);
        mutationObserver.observe(element, {
            attributes: true,
            childList: true,
            subtree: true,
        });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [retryToken, step]);

    return rect;
}

export function FeatureGuideOverlay() {
    const {
        state,
        nextStep,
        prevStep,
        skipGuide,
    } = useFeatureGuideContext();
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

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useLayoutEffect(() => {
        if (!mounted) return;
        const node = cardRef.current;
        if (!node) return;

        const updateSize = () => {
            setCardSize({
                width: node.offsetWidth,
                height: node.offsetHeight,
            });
        };

        updateSize();

        const resizeObserver = new ResizeObserver(() => updateSize());
        resizeObserver.observe(node);
        window.addEventListener("resize", updateSize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, [mounted, step]);

    const highlightPadding = step?.focusPadding ?? HIGHLIGHT_PADDING;

    if (!mounted || !step) {
        return null;
    }

    const totalSteps = state.steps.length;
    const isLastStep = state.stepIndex + 1 === totalSteps;

    const highlightBounds = rect ? clampHighlight(rect, highlightPadding) : null;
    const highlightStyle = highlightBounds
        ? {
              top: highlightBounds.top,
              left: highlightBounds.left,
              width: highlightBounds.width,
              height: highlightBounds.height,
          }
        : null;
    const highlightDecoration = highlightStyle
        ? {
              ...highlightStyle,
              boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
              borderColor: isDark ? "rgba(240, 76, 53, 0.45)" : GUIDE_ACCENT_MUTED,
          }
        : undefined;

    const tooltipStyle = rect
        ? computeTooltipPosition(rect, step, cardSize)
        : {
              top: clamp(window.innerHeight / 2 - (cardSize.height || 200) / 2, 16, window.innerHeight - 16 - (cardSize.height || 200)),
              left: clamp(window.innerWidth / 2 - (cardSize.width || 320) / 2, 16, window.innerWidth - 16 - (cardSize.width || 320)),
          };

    const overlay = (
        <div className="pointer-events-none fixed inset-0 z-[999]">
            <div
                className={`absolute inset-0 pointer-events-auto transition-colors ${isDark ? "bg-slate-950/70" : "bg-slate-950/45"}`}
                role="presentation"
                aria-hidden="true"
                onClick={skipGuide}
            />

            {highlightStyle && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed rounded-[28px] border"
                    style={highlightDecoration}
                />
            )}

            <div
                ref={cardRef}
                className={`pointer-events-auto fixed w-[min(92vw,360px)] max-w-sm rounded-[28px] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur transition-colors ${
                    isDark
                        ? "bg-slate-900/95 text-slate-100"
                        : "bg-white/95 text-slate-900"
                }`}
                style={tooltipStyle}
                role="dialog"
                aria-live="polite"
            >
                <header className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <p
                            className={`text-[11px] font-semibold uppercase tracking-[0.32em] ${
                                isDark ? "text-slate-400" : "text-slate-400"
                            }`}
                        >
                            Langkah {state.stepIndex + 1} dari {totalSteps}
                        </p>
                        <div className="space-y-1.5">
                            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{step.title}</h3>
                            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                {step.description}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={skipGuide}
                        className="-mr-1 -mt-1 text-sm font-semibold text-[#F04C35] transition-colors hover:text-[#d93d28] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F04C35]"
                    >
                        Lewati
                    </button>
                </header>

                <div className="mt-6 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={state.stepIndex === 0}
                        className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 ${
                            isDark
                                ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
                                : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        Kembali
                    </button>

                    <div className="flex items-center gap-2">
                        {state.steps.map((guideStep) => {
                            const active = guideStep.id === step.id;
                            return (
                                <span
                                    key={guideStep.id}
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{
                                        backgroundColor: active
                                            ? GUIDE_ACCENT
                                            : isDark
                                                ? "rgba(240, 76, 53, 0.35)"
                                                : GUIDE_ACCENT_MUTED,
                                        transition: "background-color 160ms ease",
                                    }}
                                />
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center justify-center rounded-full bg-[#F04C35] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d93d28] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F04C35]"
                    >
                        {isLastStep ? "Selesai" : "Lanjut"}
                    </button>
                </div>
            </div>
        </div>
    );

    return mounted ? createPortal(overlay, document.body) : null;
}
