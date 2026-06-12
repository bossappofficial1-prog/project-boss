"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { StaffMember } from "@/types/staff";

import { SetupScreen } from "./setup-screen";
import { StaffListScreen } from "./staff-list-screen";
import { PinEntryScreen } from "./pin-entry-screen";
import { FaceVerifyScreen } from "./face-verify-screen";
import { DoneScreen } from "./done-screen";
import type { PortalStep, KioskConfig, ClockType, ClockResult } from "./types";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function PortalInner() {
  const searchParams = useSearchParams();
  const urlOutletId = searchParams.get("outletId") ?? undefined;

  const [step, setStep] = useState<PortalStep>("setup");
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [clockType, setClockType] = useState<ClockType>("in");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [confirmedPin, setConfirmedPin] = useState("");
  const [result, setResult] = useState<ClockResult | null>(null);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetToStaffList = useCallback(() => {
    setSelectedStaff(null);
    setConfirmedPin("");
    setResult(null);
    setStep("staff-list");
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      // Auto-reset to staff list after inactivity
      resetToStaffList();
    }, INACTIVITY_TIMEOUT_MS);
  }, [resetToStaffList]);

  // Reset timer on any activity
  useEffect(() => {
    if (step !== "setup" && config) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [step, config, resetInactivityTimer]);

  useEffect(() => {
    // Jika ada URL param, langsung setup; jika tidak, cek localStorage
    if (urlOutletId) return; // ditangani di SetupScreen dengan auto-verify

    const savedId = localStorage.getItem("kiosk_outletId");
    if (savedId) {
      setConfig({
        outletId: savedId,
        outletName: localStorage.getItem("kiosk_outletName") ?? "Outlet",
      });
      setStep("staff-list");
    }
  }, [urlOutletId]);

  const handleSetupDone = (cfg: KioskConfig) => {
    setConfig(cfg);
    setStep("staff-list");
  };
  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setStep("pin-entry");
  };
  const handlePinConfirm = (pin: string) => {
    setConfirmedPin(pin);
    setStep("face-verify");
  };
  const handleFaceDone = (res: ClockResult) => {
    setResult(res);
    setStep("done");
  };
  const handleReset = () => {
    resetToStaffList();
  };

  // Jika URL param ada, mulai dari setup (akan auto-verify)
  const showSetup = step === "setup" || (!!urlOutletId && !config);

  return (
    <>
      {showSetup && (
        <SetupScreen prefillOutletId={urlOutletId} onDone={handleSetupDone} />
      )}
      {step === "staff-list" && config && (
        <StaffListScreen
          config={config}
          clockType={clockType}
          onSelectStaff={handleSelectStaff}
          onChangeClockType={setClockType}
          onOpenSetup={() => setStep("setup")}
        />
      )}
      {step === "pin-entry" && selectedStaff && config && (
        <PinEntryScreen
          staff={selectedStaff}
          clockType={clockType}
          outletId={config.outletId}
          onConfirm={handlePinConfirm}
          onBack={handleReset}
        />
      )}
      {step === "face-verify" && selectedStaff && config && (
        <FaceVerifyScreen
          staff={selectedStaff}
          clockType={clockType}
          pin={confirmedPin}
          outletId={config.outletId}
          onDone={handleFaceDone}
          onBack={() => setStep("pin-entry")}
        />
      )}
      {step === "done" && result && (
        <DoneScreen result={result} onBack={handleReset} />
      )}
    </>
  );
}
