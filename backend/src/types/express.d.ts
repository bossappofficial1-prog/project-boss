import { User } from '@prisma/client';
import { Outlet } from './Others';

declare global {
    namespace Express {
        export interface Request {
            user?: User;
            outlet?: Outlet;
        }
    }
}