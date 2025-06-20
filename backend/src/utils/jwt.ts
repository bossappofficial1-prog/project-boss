import { config } from "../configs/config";
import { sign } from "jsonwebtoken";

export const generateToken = async (payload: Record<string, string | number | Date>) => {
    const token = sign(payload, config.JWT_SECRET, { algorithm: "HS256", expiresIn: "30d" })

    return token;
}