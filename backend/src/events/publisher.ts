import { Outlet } from "@prisma/client";
import { redis } from "../config/redis";

export class EventPublisher {
    static async publishOutletCreated(outlet: Outlet) {
        await redis.xadd(
            'outlet-stream',
            '*',
            'event',
            'outlet.created',
            'data',
            JSON.stringify(outlet)
        )
    }
}