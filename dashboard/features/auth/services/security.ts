import { apiCall } from "@/lib/apis/base";

export interface Session {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  uri: string;
}

export const securityApi = {
  // ── Sessions ──
  listSessions: () =>
    apiCall<{ sessions: Session[] }>("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    apiCall<{ message: string }>(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  revokeOtherSessions: () =>
    apiCall<{ message: string; count: number }>("/auth/sessions/revoke-others", {
      method: "POST",
    }),

  // ── 2FA ──
  get2faStatus: () =>
    apiCall<TwoFactorStatus>("/auth/2fa/status"),

  generate2faSetup: () =>
    apiCall<TwoFactorSetup>("/auth/2fa/setup", {
      method: "POST",
    }),

  verifyAndEnable2fa: (token: string) =>
    apiCall<{ backupCodes: string[] }>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  disable2fa: (password: string) =>
    apiCall<{ message: string }>("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  authenticate2fa: (tempToken: string, token: string) =>
    apiCall<{ user: any; token: string }>("/auth/2fa/authenticate", {
      method: "POST",
      body: JSON.stringify({ tempToken, token }),
    }),

  regenerateBackupCodes: (password: string) =>
    apiCall<{ backupCodes: string[] }>("/auth/2fa/regenerate-codes", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};
