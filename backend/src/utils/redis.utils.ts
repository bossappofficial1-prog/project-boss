import { redis } from "../config/redis";
import { logger } from "./pino.logger";

export class RedisUtils {
    /**
     * Get JSON parsed from Redis Cache
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            logger.error({ err: error, key }, "Failed to GET from Redis Cache");
            return null;
        }
    }

    /**
     * Set data securely to Redis Cache with TTL
     * @param ttl in seconds (default 3600s / 1 hour)
     */
    static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            logger.error({ err: error, key }, "Failed to SET to Redis Cache");
        }
    }

    /**
     * Delete exactly matching key
     */
    static async del(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (error) {
            logger.error({ err: error, key }, "Failed to DEL from Redis Cache");
        }
    }

    /**
     * Delete multiple keys matching a pattern. Use carefully in Production!
     * E.g. pattern "pos:products:*"
     */
    static async deleteByPattern(pattern: string): Promise<void> {
        try {
            // Using SCAN is safer than KEYS *
            let cursor = "0";
            const keysToDelete: string[] = [];

            do {
                const [newCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
                cursor = newCursor;
                if (keys.length > 0) {
                    keysToDelete.push(...keys);
                }
            } while (cursor !== "0");

            if (keysToDelete.length > 0) {
                // To avoid blocking, we can del in batches if it's too large, but typically it's fine for small sets
                await redis.del(...keysToDelete);
                logger.info({ count: keysToDelete.length, pattern }, "Deleted cached keys by pattern");
            }
        } catch (error) {
            logger.error({ err: error, pattern }, "Failed to deleteByPattern from Redis Cache");
        }
    }
}
