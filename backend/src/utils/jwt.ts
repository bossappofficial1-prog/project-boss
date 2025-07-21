import jwt from 'jsonwebtoken';
import { config } from '../config';

export const JwtUtil = {
    generate(payload: any, expiresIn: any = '1D'): string {
        return jwt.sign(payload, config.JWT_SECRET, { algorithm: "HS256", expiresIn });
    },

    verify<T>(token: string): T {
        return jwt.verify(token, config.JWT_SECRET) as T;
    },

    decode(token: string): any {
        return jwt.decode(token);
    }
};
