import {
  Business,
  BusinessSubscription,
  SubscriptionInvoice,
  SubscriptionPlan,
  User as PrismaUser,
} from "@prisma/client";
import { Outlet } from "./Others";

type SubscriptionContext = Business & {
  currentSubscription?:
    | (BusinessSubscription & {
        plan: SubscriptionPlan | null;
        invoices: SubscriptionInvoice[];
      })
    | null;
};

declare global {
  namespace Express {
    export interface Request {
      storedUser?: PrismaUser & { businessId: string };
      storedCashier?: {
        id: string;
        username?: string;
        name: string;
        outletId: string;
        businessId: string;
        userType: "CASHIER" | "MANAGER";
        sessionId: string;
        role: "CASHIER" | "MANAGER";
        privileges?: string[];
      };
      outlet?: Outlet;
      subscriptionContext?: SubscriptionContext;
    }
  }
}
