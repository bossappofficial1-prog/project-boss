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
                  hideObject: true,
              },
          }
);

const rawLogger = pino(
    {
        level: config.isProduction ? "info" : "debug",
        base: { service: config.SERVICE },
    },
    transport
);

interface LogCompatMethod {
    (msg: string, ...args: any[]): void;
    (obj: object, msg?: string, ...args: any[]): void;
}

export interface CompatLogger extends Omit<pino.Logger, "info" | "error" | "warn" | "debug" | "trace" | "fatal"> {
    info: LogCompatMethod;
    error: LogCompatMethod;
    warn: LogCompatMethod;
    debug: LogCompatMethod;
    trace: LogCompatMethod;
    fatal: LogCompatMethod;
}

/**
 * Proxy handler untuk menjembatani API Winston-style (msg, meta?) ke API Pino (meta, msg).
 * Ini memungkinkan transisi mulus dan fleksibilitas penuh di seluruh codebase tanpa merusak tipe TS.
 */
const proxyHandler: ProxyHandler<pino.Logger> = {
    get(target, prop, receiver) {
        if (
            prop === "info" ||
            prop === "error" ||
            prop === "warn" ||
            prop === "debug" ||
            prop === "trace" ||
            prop === "fatal"
        ) {
            return (msgOrObj: any, ...args: any[]) => {
                const logMethod = (target as any)[prop].bind(target);
                if (typeof msgOrObj === "string") {
                    const meta = args[0];
                    if (meta instanceof Error) {
                        logMethod(meta, msgOrObj);
                    } else {
                        logMethod(meta && typeof meta === "object" ? meta : {}, msgOrObj, ...args.slice(1));
                    }
                } else {
                    logMethod(msgOrObj, ...args);
                }
            };
        }
        return Reflect.get(target, prop, receiver);
    }
};

export const logger = new Proxy(rawLogger, proxyHandler) as unknown as CompatLogger;

export default logger;
