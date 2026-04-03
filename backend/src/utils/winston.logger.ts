import { logger as pinoLogger } from "./pino.logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogMeta = any;

/**
 * Adapter yang menjembatani API Winston (msg, meta?) ke API Pino (meta, msg).
 * Digunakan oleh file-file lama agar tidak perlu diubah semua sekaligus.
 * @deprecated Gunakan `pino.logger` secara langsung untuk kode baru.
 */
const winstonCompatLogger = {
    error(msg: string, meta?: LogMeta) {
        pinoLogger.error(meta ?? {}, msg);
    },
    warn(msg: string, meta?: LogMeta) {
        pinoLogger.warn(meta ?? {}, msg);
    },
    info(msg: string, meta?: LogMeta) {
        pinoLogger.info(meta ?? {}, msg);
    },
    http(msg: string, meta?: LogMeta) {
        pinoLogger.info(meta ?? {}, msg);
    },
    debug(msg: string, meta?: LogMeta) {
        pinoLogger.debug(meta ?? {}, msg);
    },
    verbose(msg: string, meta?: LogMeta) {
        pinoLogger.trace(meta ?? {}, msg);
    },
};

export default winstonCompatLogger;
