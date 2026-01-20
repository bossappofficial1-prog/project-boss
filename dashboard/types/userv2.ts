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
    isVerified: boolean;
    phone?: string;
    googleId?: string;
    provider: typeof userProvider[number];
    createdAt: string;
    updateAt: string
}

export type createUserPayload = Pick<User, "name" | "email" | "password" | "role">
export type updateUserPayload = Partial<createUserPayload>


export interface UserDetail {
    user: User
    business: Business
    wallet: Wallet
    recentActivity: RecentActivity
}

export interface Business {
    id: string
    name: string
    description: string
    bankInfo: BankInfo
    config: Config
}

export interface BankInfo {
    bankName: string
    bankAccount: string
    accountHolder: string
}

export interface Config {
    feeBearer: string
    totalOutlets: number
    totalMembers: number
}

export interface Wallet {
    balance: number
    pendingWithdrawal: number
}

export interface RecentActivity {
    lastWithdrawal: string
    lastWithdrawalStatus: string
}