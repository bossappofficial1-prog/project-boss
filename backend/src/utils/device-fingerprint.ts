import { createHash } from "crypto";

export interface DeviceFingerprintInput {
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  timezone?: string;
  language?: string;
}

export class DeviceFingerprint {
  static compute(input: DeviceFingerprintInput): string {
    const parts = [
      input.userAgent || "",
      input.screenWidth || 0,
      input.screenHeight || 0,
      input.timezone || "",
      input.language || "",
    ];
    return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
  }

  static fromReq(req: { headers: Record<string, string | string[] | undefined> }): string {
    const ua = (req.headers["user-agent"] as string) || "";
    const screen = (req.headers["x-screen-size"] as string) || "";
    const tz = (req.headers["x-timezone"] as string) || "";
    const lang = (req.headers["x-language"] as string) || "";

    const [w, h] = screen.split("x").map(Number);

    return DeviceFingerprint.compute({
      userAgent: ua,
      screenWidth: w || 0,
      screenHeight: h || 0,
      timezone: tz,
      language: lang,
    });
  }
}
