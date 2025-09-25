import { User as PrismaUser } from '@prisma/client';
import { Outlet } from './Others';

declare global {
    namespace Express {
        export interface Request {
            storedUser?: PrismaUser;
            outlet?: Outlet;
        }
    }
}