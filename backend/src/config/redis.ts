import Redis from 'ioredis';
import { config } from '.';

export const redis = new Redis(config.redis.url);