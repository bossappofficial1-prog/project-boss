import { NextFunction, Request, Response } from "express";
import logger from "../utils/winston.logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();

    res.on("finish", () => {
        const [seconds, nanoseconds] = process.hrtime(start)
        const responseTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2)

        logger.info("Incoming request", {
            methhod: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            statusCode: res.statusCode,
            responseTime: `${responseTime} ms`
        })
    })

    next()
}