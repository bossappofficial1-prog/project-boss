"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/features/auth";

export function useTwoFactorGate() {
  const { user } = useAuth();
  const [showVerify, setShowVerify] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const is2faEnabled = (user as any)?.twoFactorEnabled ?? false;

  const require2FA = useCallback(
    (action: () => void) => {
      if (!is2faEnabled) {
        action();
        return;
      }
      setPendingAction(() => action);
      setShowVerify(true);
    },
    [is2faEnabled],
  );

  const handleVerified = useCallback(() => {
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const handleOpenChange = useCallback((open: boolean) => {
    setShowVerify(open);
    if (!open) setPendingAction(null);
  }, []);

  return {
    is2faEnabled,
    showVerify,
    require2FA,
    handleVerified,
    handleOpenChange,
  };
}
