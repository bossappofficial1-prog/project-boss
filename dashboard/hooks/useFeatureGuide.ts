"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
    FeatureGuideState,
    GuideOptions,
    GuideStep,
    hasGuideBeenSeen,
    StartGuidePayload,
    useFeatureGuideContext,
} from "@/components/guides/FeatureGuideProvider";

export type UseFeatureGuideConfig = {
    id: string;
    steps: GuideStep[];
    autoStart?: boolean;
    runOnceKey?: string;
    delay?: number;
    enabled?: boolean;
    options?: Omit<GuideOptions, "onceKey">;
};

export type UseFeatureGuideReturn = {
    isActive: boolean;
    state: FeatureGuideState;
    currentStep: GuideStep | null;
    start: () => void;
    next: () => void;
    prev: () => void;
    skip: () => void;
    stop: () => void;
    stepIndex: number;
    totalSteps: number;
};

export function useFeatureGuide({
    id,
    steps,
    autoStart = false,
    runOnceKey,
    delay = 400,
    enabled = true,
    options,
}: UseFeatureGuideConfig): UseFeatureGuideReturn {
    const {
        state,
        startGuide,
        stopGuide,
        nextStep,
        prevStep,
        skipGuide,
    } = useFeatureGuideContext();

    const isActive = state.activeGuideId === id;
    const totalSteps = isActive ? state.steps.length : steps.length;
    const stepIndex = isActive ? state.stepIndex : 0;
    const currentStep = isActive ? state.steps[state.stepIndex] : null;

    const start = useCallback(() => {
        if (!steps.length) return;
        if (runOnceKey && hasGuideBeenSeen(runOnceKey)) return;
        startGuide({
            id,
            steps,
            options: {
                ...options,
                onceKey: runOnceKey,
            },
        } satisfies StartGuidePayload);
    }, [id, options, runOnceKey, startGuide, steps]);

    useEffect(() => {
        if (!autoStart || !enabled) return;
        if (state.activeGuideId) return;
        if (runOnceKey && hasGuideBeenSeen(runOnceKey)) return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            start();
        }, delay);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [autoStart, delay, enabled, id, runOnceKey, start, state.activeGuideId]);

    const next = useCallback(() => {
        if (!isActive) return;
        nextStep();
    }, [isActive, nextStep]);

    const prev = useCallback(() => {
        if (!isActive) return;
        prevStep();
    }, [isActive, prevStep]);

    const skip = useCallback(() => {
        if (!isActive) return;
        skipGuide();
    }, [isActive, skipGuide]);

    const stop = useCallback(() => {
        if (!isActive) return;
        stopGuide();
    }, [isActive, stopGuide]);

    return useMemo(
        () => ({
            isActive,
            state,
            currentStep,
            start,
            next,
            prev,
            skip,
            stop,
            stepIndex,
            totalSteps,
        }),
        [
            currentStep,
            isActive,
            next,
            prev,
            skip,
            start,
            state,
            stepIndex,
            stop,
            totalSteps,
        ],
    );
}
