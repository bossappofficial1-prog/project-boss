import { BaseService } from "./base.service";
import { SessionRepository } from "../repositories/session.repository";
import { redis } from "../config/redis";
import { randomUUID } from "crypto";

const SESSION_TTL_SECONDS = 24 * 60 * 60;

export class SessionService extends BaseService {
  static async create(
    userId: string,
    req: { headers: Record<string, string | string[] | undefined>; ip?: string },
  ) {
    const sessionId = randomUUID();
    const userAgent = (req.headers["user-agent"] as string) || "Unknown";
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";
    const parsed = SessionService.parseUserAgent(userAgent);

    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

    await SessionRepository.create({
      id: sessionId,
      userId,
      deviceName: parsed.deviceName,
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      os: parsed.os,
      ip,
      isCurrent: true,
      expiresAt,
    });

    await redis.setex(
      `session:${sessionId}`,
      SESSION_TTL_SECONDS,
      JSON.stringify({ userId, sessionId }),
    );

    await redis.sadd(`user_sessions:${userId}`, sessionId);
    await redis.expire(`user_sessions:${userId}`, SESSION_TTL_SECONDS * 7);

    return sessionId;
  }

  static async list(userId: string, currentSessionId: string) {
    await SessionRepository.deleteExpiredByUserId(userId);

    const sessions = await SessionRepository.findActiveByUserId(userId);

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      isCurrent: s.id === currentSessionId,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  static async revoke(userId: string, sessionId: string) {
    const session = await SessionRepository.findByIdAndUser(sessionId, userId);
    if (!session) this.notFound("Sesi tidak ditemukan");

    await SessionRepository.deleteById(sessionId);
    await redis.del(`session:${sessionId}`);
    await redis.srem(`user_sessions:${userId}`, sessionId);
  }

  static async revokeOtherSessions(userId: string, currentSessionId: string) {
    const sessions = await SessionRepository.findActiveByUserId(userId);
    const otherIds = sessions
      .filter((s) => s.id !== currentSessionId)
      .map((s) => s.id);

    if (otherIds.length === 0) return 0;

    await SessionRepository.deleteManyByIds(otherIds);

    const pipeline = redis.pipeline();
    for (const id of otherIds) {
      pipeline.del(`session:${id}`);
      pipeline.srem(`user_sessions:${userId}`, id);
    }
    await pipeline.exec();

    return otherIds.length;
  }

  static async touch(sessionId: string) {
    await SessionRepository.updateLastActive(sessionId);
  }

  private static parseUserAgent(ua: string) {
    const uaLower = ua.toLowerCase();
    let deviceName = ua;
    let deviceType = "desktop";
    let browser = "Unknown";
    let os = "Unknown";

    if (/mobile|android|iphone|ipad|ipod/i.test(uaLower)) {
      deviceType = "mobile";
    } else if (/tablet|ipad/i.test(uaLower)) {
      deviceType = "tablet";
    }

    if (/chrome/i.test(uaLower) && !/edge|opr/i.test(uaLower)) {
      browser = "Chrome";
    } else if (/firefox/i.test(uaLower)) {
      browser = "Firefox";
    } else if (/safari/i.test(uaLower) && !/chrome/i.test(uaLower)) {
      browser = "Safari";
    } else if (/edge/i.test(uaLower)) {
      browser = "Edge";
    } else if (/opr|opera/i.test(uaLower)) {
      browser = "Opera";
    }

    if (/windows/i.test(uaLower)) os = "Windows";
    else if (/macintosh|mac os x/i.test(uaLower)) os = "macOS";
    else if (/linux/i.test(uaLower) && !/android/i.test(uaLower)) os = "Linux";
    else if (/android/i.test(uaLower)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(uaLower)) os = "iOS";

    const match = ua.match(/\(([^)]+)\)/);
    if (match) deviceName = match[1];

    return { deviceName, deviceType, browser, os };
  }
}
