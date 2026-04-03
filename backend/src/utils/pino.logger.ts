import pino from "pino";
import { config } from "../config";
import path from "path";
import fs from "fs";

const LOG_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const transport = pino.transport(
    config.isProduction
        ? {
              targets: [
                  // Combined log - semua level
                  {
                      target: "pino-roll",
                      level: "info",
                      options: {
                          file: path.join(LOG_DIR, "combined.log"),
                          frequency: "daily",
                          size: "10m",
                          mkdir: true,
                          extension: ".log",
                          dateFormat: "yyyy-MM-dd",
                      },
                  },
                  // Error log - hanya level error ke atas
                  {
                      target: "pino-roll",
                      level: "error",
                      options: {
                          file: path.join(LOG_DIR, "error.log"),
                          frequency: "daily",
                          mkdir: true,
                          extension: ".log",
                          dateFormat: "yyyy-MM-dd",
                      },
                  },
              ],
          }
        : {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:HH:MM:ss",
                  ignore: "pid,hostname,service,req.ip,req.userAgent,res",
                  messageFormat:
                      "{req.method} {req.url} → {res.statusCode} ({responseTime}ms)",
                  hideObject: true,
              },
          }
);

export const logger = pino(
    {
        level: config.isProduction ? "info" : "debug",
        base: { service: config.SERVICE },
    },
    transport
);

export default logger;
