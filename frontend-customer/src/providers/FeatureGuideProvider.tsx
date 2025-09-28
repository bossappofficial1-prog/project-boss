"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type GuidePlacement = "top" | "bottom" | "left" | "right";

export type GuideStep = {
    id: string;
    title: string;
    description: string;
    target: string;
    placement?: GuidePlacement;
    offset?: number;
    focusPadding?: number;
};

export type GuideOptions = {
    onceKey?: string;
    onStart?: () => void;
    onComplete?: () => void;
    onSkip?: () => void;
};

export type StartGuidePayload = {
    id: string;
    steps: GuideStep[];
    options?: GuideOptions;
};

export type FeatureGuideState = {
    activeGuideId: string | null;
    steps: GuideStep[];
    stepIndex: number;
};

const initialState: FeatureGuideState = {
    activeGuideId: null,
    steps: [],
    stepIndex: 0,
};

export type FeatureGuideContextValue = {
    state: FeatureGuideState;
    startGuide: (payload: StartGuidePayload) => void;
    stopGuide: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipGuide: () => void;
};

const FeatureGuideContext = createContext<FeatureGuideContextValue | undefined>(
    undefined,
);

function persistOnceKey(key?: string) {
    if (!key) return;
    try {
        localStorage.setItem(key, "1");
    } catch {
        /* noop */
    }
}

function removeOnceKey(key?: string) {
    if (!key) return;
    try {
        localStorage.removeItem(key);
    } catch {
        /* noop */
    }
}

export function FeatureGuideProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [state, setState] = useState<FeatureGuideState>(initialState);
    const metaRef = useRef<GuideOptions | undefined>(undefined);

    const resetGuide = useCallback(() => {
        setState(initialState);
        metaRef.current = undefined;
    }, []);

    const startGuide = useCallback(({ id, steps, options }: StartGuidePayload) => {
        if (!steps.length) return;
        metaRef.current = options;
        setState({
            activeGuideId: id,
            steps,
            stepIndex: 0,
        });
        options?.onStart?.();
    }, []);

    const stopGuide = useCallback(() => {
        resetGuide();
    }, [resetGuide]);

    const completeGuide = useCallback(() => {
        const meta = metaRef.current;
        persistOnceKey(meta?.onceKey);
        meta?.onComplete?.();
        resetGuide();
    }, [resetGuide]);

    const skipGuide = useCallback(() => {
        const meta = metaRef.current;
        persistOnceKey(meta?.onceKey);
        meta?.onSkip?.();
        resetGuide();
    }, [resetGuide]);

    const nextStep = useCallback(() => {
        let shouldComplete = false;
        setState((prev) => {
            if (!prev.activeGuideId) return prev;
            if (prev.stepIndex + 1 < prev.steps.length) {
                return {
                    ...prev,
                    stepIndex: prev.stepIndex + 1,
                };
            }
            shouldComplete = true;
            return prev;
        });
        if (shouldComplete) {
            completeGuide();
        }
    }, [completeGuide]);

    const prevStep = useCallback(() => {
        setState((prev) => {
            if (!prev.activeGuideId) return prev;
            if (prev.stepIndex === 0) return prev;
            return {
                ...prev,
                stepIndex: prev.stepIndex - 1,
            };
        });
    }, []);

    const value = useMemo<FeatureGuideContextValue>(() => ({
        state,
        startGuide,
        stopGuide,
        nextStep,
        prevStep,
        skipGuide,
    }), [state, startGuide, stopGuide, nextStep, prevStep, skipGuide]);

    return (
        <FeatureGuideContext.Provider value={value}>
            {children}
        </FeatureGuideContext.Provider>
    );
}

export function useFeatureGuideContext() {
    const ctx = useContext(FeatureGuideContext);
    if (!ctx) {
        throw new Error(
            "useFeatureGuideContext must be used within a FeatureGuideProvider",
        );
    }
    return ctx;
}

export function hasGuideBeenSeen(key?: string): boolean {
    if (!key) return false;
    try {
        return localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
}

export function resetGuideSeen(key?: string) {
    removeOnceKey(key);
}
