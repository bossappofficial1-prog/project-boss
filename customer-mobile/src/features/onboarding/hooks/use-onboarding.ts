import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const ONBOARDING_KEY = "hasSeenOnboarding";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) {
        const timer = setTimeout(() => setShowOnboarding(true), 1500);
        return () => clearTimeout(timer);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, 2));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const complete = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }, []);

  const skip = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }, []);

  return {
    showOnboarding,
    currentStep,
    isLoading,
    goNext,
    goBack,
    complete,
    skip,
    setCurrentStep,
    isLastStep: currentStep === 2,
    isFirstStep: currentStep === 0,
  };
}
