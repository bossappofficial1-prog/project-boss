"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  GuideStep,
  useFeatureGuideContext,
} from "@/features/guides/components/feature-guide-provider";
import { useTheme } from "@/contexts/ThemeContext";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

const HIGHLIGHT_PADDING = 14;
const DEFAULT_OFFSET = 24;

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
  const cardWidth = card.width || 360;
  const cardHeight = card.height || 220;

  if (placement === "bottom") {
    return {
      top: clamp(
        rect.bottom + offset,
        margin,
        window.innerHeight - margin - cardHeight,
      ),
      left: clamp(
        rect.left + rect.width / 2 - cardWidth / 2,
        margin,
        window.innerWidth - margin - cardWidth,
      ),
    };
  }
  if (placement === "left") {
    return {
      top: clamp(
        rect.top + rect.height / 2 - cardHeight / 2,
        margin,
        window.innerHeight - margin - cardHeight,
      ),
      left: clamp(
        rect.left - offset - cardWidth,
        margin,
        window.innerWidth - margin - cardWidth,
      ),
    };
  }
  if (placement === "right") {
    return {
      top: clamp(
        rect.top + rect.height / 2 - cardHeight / 2,
        margin,
        window.innerHeight - margin - cardHeight,
      ),
      left: clamp(
        rect.right + offset,
        margin,
        window.innerWidth - margin - cardWidth,
      ),
    };
  }
  return {
    top: clamp(
      rect.top - offset - cardHeight,
      margin,
      window.innerHeight - margin - cardHeight,
    ),
    left: clamp(
      rect.left + rect.width / 2 - cardWidth / 2,
      margin,
      window.innerWidth - margin - cardWidth,
    ),
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
    if (!step) {
      setRect(null);
      return;
    }

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
function StepBadge({ current, total }: { current: number; total: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
        {current}
      </span>
      <span className="text-[11px] font-semibold tracking-wide text-primary/80">
        dari {total}
      </span>
    </div>
  );
}

/* ─── Dot Indicators ────────────────────────────────────────── */
function DotIndicators({
  steps,
  activeId,
}: {
  steps: GuideStep[];
  activeId: string;
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
                ? "hsl(var(--primary))"
                : "hsl(var(--primary) / 0.2)",
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Close Button ─────────────────────────────────────────── */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tutup panduan"
      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export function FeatureGuideOverlay() {
  const { state, nextStep, prevStep, skipGuide } = useFeatureGuideContext();
  const { actualTheme } = useTheme();

  const step = useMemo(() => {
    if (!state.activeGuideId) return null;
    return state.steps[state.stepIndex] ?? null;
  }, [state]);

  const rect = useTargetRect(step);
  const [mounted, setMounted] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>({ width: 0, height: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isDark = actualTheme === "dark";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const node = cardRef.current;
    if (!node) return;

    const update = () =>
      setCardSize({ width: node.offsetWidth, height: node.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [mounted, step]);

  useEffect(() => {
    if (mounted && step) cardRef.current?.focus();
  }, [mounted, step]);

  useEffect(() => {
    if (!step) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipGuide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextStep, prevStep, skipGuide, step]);

  if (!mounted || !step) return null;

  const totalSteps = state.steps.length;
  const isLastStep = state.stepIndex + 1 === totalSteps;
  const progress = totalSteps
    ? Math.round(((state.stepIndex + 1) / totalSteps) * 100)
    : 0;
  const titleId = `fgt-${step.id}`;
  const descId = `fgd-${step.id}`;
  const highlightPadding = step.focusPadding ?? HIGHLIGHT_PADDING;
  const highlightBounds = rect ? clampHighlight(rect, highlightPadding) : null;

  const tooltipStyle = rect
    ? computeTooltipPosition(rect, step, cardSize)
    : {
        top: clamp(
          window.innerHeight / 2 - (cardSize.height || 200) / 2,
          16,
          window.innerHeight - 232,
        ),
        left: clamp(
          window.innerWidth / 2 - (cardSize.width || 360) / 2,
          16,
          window.innerWidth - 376,
        ),
      };

  const overlay = (
    <>
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

      <div className="pointer-events-none fixed inset-0 z-999">
        {/* Backdrop */}
        <div
          className="absolute inset-0 pointer-events-auto transition-opacity duration-300"
          style={{
            background: isDark
              ? "oklch(0 0 0 / 0.72)"
              : "oklch(0.1 0 0 / 0.48)",
          }}
          role="presentation"
          aria-hidden="true"
          onClick={skipGuide}
        />

        {/* Highlight cutout */}
        {highlightBounds && (
          <>
            {/* Pulsing ring */}
            <div
              aria-hidden="true"
              className="fg-highlight-ring pointer-events-none fixed rounded-lg"
              style={{
                top: highlightBounds.top - 4,
                left: highlightBounds.left - 4,
                width: highlightBounds.width + 8,
                height: highlightBounds.height + 8,
                border: "2px solid hsl(var(--primary))",
                opacity: 0.4,
              }}
            />
            {/* Highlight border */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed rounded-lg"
              style={{
                top: highlightBounds.top,
                left: highlightBounds.left,
                width: highlightBounds.width,
                height: highlightBounds.height,
                boxShadow: `0 0 0 9999px ${isDark ? "oklch(0 0 0 / 0.72)" : "oklch(0.1 0 0 / 0.48)"}`,
                border: "2px solid hsl(var(--primary) / 0.5)",
                outline: "4px solid hsl(var(--primary) / 0.1)",
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
          className="fg-card-enter pointer-events-auto fixed w-[min(92vw,360px)] rounded-xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur-xl focus:outline-none"
          style={tooltipStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          aria-live="polite"
        >
          {/* Progress bar */}
          <div
            className="absolute left-6 right-6 top-0 h-0.5 rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(var(--primary)), transparent ${progress}%, transparent)`,
            }}
            aria-hidden="true"
          />

          {/* Header row */}
          <header className="flex items-start justify-between gap-3 pt-1">
            <StepBadge current={state.stepIndex + 1} total={totalSteps} />
            <CloseButton onClick={skipGuide} />
          </header>

          {/* Content */}
          <div className="mt-4 space-y-2">
            <h3
              id={titleId}
              className="text-base font-semibold tracking-tight text-foreground"
            >
              {step.title}
            </h3>
            <p
              id={descId}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {step.description}
            </p>
          </div>

          {/* Progress indicator */}
          <div
            className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Progress panduan"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Footer row */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prevStep}
              disabled={state.stepIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </button>

            <DotIndicators steps={state.steps} activeId={step.id} />

            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLastStep ? "Selesai" : "Lanjut"}
              {isLastStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="mt-3 text-center text-xs text-muted-foreground/40">
            ← → Enter untuk navigasi &nbsp;·&nbsp; Esc untuk tutup
          </p>
        </div>
      </div>
    </>
  );

  return mounted ? createPortal(overlay, document.body) : null;
}
