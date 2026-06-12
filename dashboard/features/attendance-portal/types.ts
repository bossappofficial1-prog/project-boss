import type { StaffMember } from "@/types/staff";

export type PortalStep = "setup" | "staff-list" | "pin-entry" | "face-verify" | "done";
export type ClockType = "in" | "out";

export interface KioskConfig {
  outletId: string;
  outletName: string;
}

export interface ClockResult {
  success: boolean;
  type: ClockType;
  staffName: string;
  time: string;
  message: string;
}

export interface SetupScreenProps {
  prefillOutletId?: string;
  onDone: (cfg: KioskConfig) => void;
}

export interface StaffListScreenProps {
  config: KioskConfig;
  clockType: ClockType;
  onSelectStaff: (staff: StaffMember) => void;
  onChangeClockType: (t: ClockType) => void;
  onOpenSetup: () => void;
}

export interface PinEntryScreenProps {
  staff: StaffMember;
  clockType: ClockType;
  outletId: string;
  onConfirm: (pin: string) => void;
  onBack: () => void;
}

export interface FaceVerifyScreenProps {
  staff: StaffMember;
  clockType: ClockType;
  pin: string;
  outletId: string;
  onDone: (r: ClockResult) => void;
  onBack: () => void;
}

export interface DoneScreenProps {
  result: ClockResult;
  onBack: () => void;
}

export interface StaffAvatarProps {
  staff: StaffMember;
  size?: "md" | "lg";
}
