import pinoHttp from "pino-http";
import { logger } from "../utils/pino.logger";

/**
 * HTTP request logger middleware menggunakan pino-http.
 * Log ditulis SETELAH response selesai (non-blocking by design).
 */
export const requestLogger = pinoHttp({
    logger,
    // Jangan log health check endpoint agar log tidak dipenuhi cek kesehatan
    autoLogging: {
        ignore: (req) => req.url === "/health" || req.url === "/",
    },
    // Kustom field yang dicatat
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
                ip: req.remoteAddress,
                userAgent: req.headers["user-agent"],
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
});