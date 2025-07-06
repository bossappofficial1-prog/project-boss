import Redis from 'ioredis';

export class RedisService {
    private static instance: RedisService;
    private client: Redis;

    private constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0'),
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            connectTimeout: 10000,
        });

        // Event handlers
        this.client.on('connect', () => {
            console.log('✅ Redis connected');
        });

        this.client.on('error', (error) => {
            console.error('❌ Redis error:', error);
        });

        this.client.on('close', () => {
            console.log('⚠️ Redis connection closed');
        });
    }

    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    public getClient(): Redis {
        return this.client;
    }

    // Cache operations
    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl) {
            await this.client.setex(key, ttl, stringValue);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    public async get<T = any>(key: string): Promise<T | null> {
        const value = await this.client.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value as T;
        }
    }

    public async del(key: string): Promise<number> {
        return await this.client.del(key);
    }

    public async exists(key: string): Promise<boolean> {
        return (await this.client.exists(key)) === 1;
    }

    public async increment(key: string, value: number = 1): Promise<number> {
        return await this.client.incrby(key, value);
    }

    public async expire(key: string, ttl: number): Promise<boolean> {
        return (await this.client.expire(key, ttl)) === 1;
    }

    public async getPattern(pattern: string): Promise<string[]> {
        return await this.client.keys(pattern);
    }

    public async flushAll(): Promise<void> {
        await this.client.flushall();
    }

    // Hash operations
    public async hset(key: string, field: string, value: any): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await this.client.hset(key, field, stringValue);
    }

    public async hget<T = any>(key: string, field: string): Promise<T | null> {
        const value = await this.client.hget(key, field);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value as T;
        }
    }

    public async hdel(key: string, field: string): Promise<number> {
        return await this.client.hdel(key, field);
    }

    public async hgetall<T = any>(key: string): Promise<Record<string, T>> {
        const data = await this.client.hgetall(key);
        const result: Record<string, T> = {};

        for (const [field, value] of Object.entries(data)) {
            try {
                result[field] = JSON.parse(value);
            } catch {
                result[field] = value as T;
            }
        }

        return result;
    }

    // List operations
    public async lpush(key: string, value: any): Promise<number> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return await this.client.lpush(key, stringValue);
    }

    public async rpush(key: string, value: any): Promise<number> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return await this.client.rpush(key, stringValue);
    }

    public async lpop<T = any>(key: string): Promise<T | null> {
        const value = await this.client.lpop(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value as T;
        }
    }

    public async rpop<T = any>(key: string): Promise<T | null> {
        const value = await this.client.rpop(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return value as T;
        }
    }

    public async llen(key: string): Promise<number> {
        return await this.client.llen(key);
    }

    public async disconnect(): Promise<void> {
        await this.client.disconnect();
    }
}