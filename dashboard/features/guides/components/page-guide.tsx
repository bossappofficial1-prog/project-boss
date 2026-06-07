"use client";

import { GuideStep, resetGuideSeen } from "@/features/guides/components/feature-guide-provider";
import { useFeatureGuide } from "@/hooks/use-feature-guide";

type PageGuideProps = {
  id: string;
  steps: GuideStep[];
  runOnceKey: string;
  delay?: number;
  enabled?: boolean;
};

export function PageGuide({ id, steps, runOnceKey, delay, enabled = true }: PageGuideProps) {
  useFeatureGuide({
    id,
    steps,
    autoStart: true,
    runOnceKey,
    delay: delay ?? 500,
    enabled,
  });

  return null;
}

export function resetGuide(runOnceKey: string) {
  resetGuideSeen(runOnceKey);
}
