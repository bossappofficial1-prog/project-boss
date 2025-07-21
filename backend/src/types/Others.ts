import { $Enums } from "@prisma/client";

export type UserMe = {
    name: string;
    id: string;
    email: string;
    avatar: string | null;
    password: string;
    role: $Enums.UserRole;
    isVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpires: Date | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
    business: {
        id: string,
        name: string,
        description: string,
        outlets: Outlet[]
    }
}

export type Outlet = {
    id: string;
    name: string;
    businessId: string
}