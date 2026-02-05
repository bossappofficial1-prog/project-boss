import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

/**
 * Ensures an incoming value is treated as a single non-empty string.
 * Accepts string literals or string arrays (from Express query parsing).
 */
export const ensureString = (value: unknown, fieldName: string): string => {
    if (typeof value === "string" && value.trim() !== "") {
        return value;
    }

    if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === "string" && first.trim() !== "") {
            return first;
        }
    }

    throw new AppError(`Parameter '${fieldName}' tidak valid`, HttpStatus.BAD_REQUEST);
};
