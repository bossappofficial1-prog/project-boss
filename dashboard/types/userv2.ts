export const userRole = ["ADMIN", "OWNER"] as const
export const userProvider = ["local", "google"] as const

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    password: string;
    role: typeof userRole[number];
    isVerivied: boolean;
    phone?: string;
    googleId?: string;
    provider: typeof userProvider[number];
    createdAt: string;
    updateAt: string
}

export type createUserPayload = Pick<User, "name" | "email" | "password" | "role">
export type updateUserPayload = Partial<createUserPayload>