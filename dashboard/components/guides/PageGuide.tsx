"use client";

import { GuideStep, resetGuideSeen } from "@/components/guides/FeatureGuideProvider";
import { useFeatureGuide } from "@/hooks/useFeatureGuide";

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
