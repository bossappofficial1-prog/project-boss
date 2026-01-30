import { monitorService } from "../service/server-monitor.service";
import { asyncHandler } from "./error.middleware";
import { NextFunction, Request, Response } from 'express'

export const traffictMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    monitorService.incrementRequest()

    const start = Date.now()
    let logged = false

    const pushLog = () => {
        if (logged) return
        logged = true

        const duration = Date.now() - start;
        const method = req.method;
        const url = req.originalUrl;
        const status = res.statusCode || 0;
        const type = status >= 400 ? '[ERROR]' : '[SUCCESS]';

        monitorService.addLog(`${type} ${method} ${url} ${status} (${duration}ms)`)
    }

    res.on('finish', pushLog)
    res.on('close', () => {
        if (!res.writableEnded) {
            pushLog()
        }
    })

    monitorService.addLog(`[INFO] ${req.method} ${req.originalUrl} dimulai`);
    next()
})
