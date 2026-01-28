import { apiClient } from "@/lib/ApiClient"
import {
    BarChart3,
    Calendar,
    CreditCard,
    FilePlus,
    FileSearch,
    FileText,
    Folder,
    HelpCircle,
    Home,
    LayoutDashboard,
    Mail,
    Megaphone,
    Server,
    ServerCog,
    Settings,
    ShoppingCart,
    Store,
    Users,
    Wallet,
    type LucideIcon
} from "lucide-react"

export type SidebarItem = {
    title: string
    url: string // Menggunakan 'url' atau 'href' untuk routing
    id: string
    icon?: LucideIcon
    badge?: string
    isActive?: boolean // Untuk default open state pada submenu
    items?: SidebarItem[] // Recursive structure for submenus
}

export type SidebarSection = {
    label: string
    items: SidebarItem[]
}

export const userData = async (): Promise<{ name: string, email: string }> => {
    const response = await await apiClient.get('/auth/me');
    const data = response.data
    return { name: data.name, email: data.email }
}

export const sidebarData: {
    user: { name: string; email: string; avatar: string }
    sections: SidebarSection[]
} = {
    user: {
        name: "Admin Boss",
        email: "admin@boss-platform.com",
        avatar: "/avatars/admin.jpg",
    },
    sections: [
        {
            label: "Overview",
            items: [
                {
                    title: "Dashboard",
                    id: "dashboard",
                    icon: LayoutDashboard,
                    url: `/admin/dashboard`
                },
                {
                    title: "Platform Analytics",
                    id: "analytics",
                    icon: BarChart3,
                    url: ``,
                    items: [
                        {
                            title: "User Growth",
                            id: "analytics-users",
                            url: `/admin/analytics/users`
                        },
                        {
                            title: "Revenue (MRR)",
                            id: "analytics-revenue",
                            url: `/admin/analytics/revenue`
                        },
                    ]
                }
            ],
        },
        {
            label: "Manajemen Tenant (SaaS)",
            items: [
                {
                    title: "Bisnis Terdaftar",
                    id: "businesses",
                    icon: Store,
                    url: ``,
                    items: [
                        {
                            title: "Semua Merchant",
                            id: "businesses-all",
                            url: `/admin/businesses/all`
                        },
                        {
                            title: "Merchant Baru",
                            id: "businesses-new",
                            badge: "New",
                            url: `/admin/businesses/new`
                        },
                        {
                            title: "Status Suspend",
                            id: "businesses-suspend",
                            url: `/admin/businesses/suspend`
                        },
                    ],
                },
                {
                    title: "Database User",
                    id: "users",
                    icon: Users,
                    url: '/admin/users'
                },
            ],
        },
        {
            label: "Langganan & Billing",
            items: [
                {
                    title: "Paket Langganan",
                    id: "subscriptions",
                    icon: CreditCard,
                    url: ``,
                    items: [
                        {
                            title: "Monitoring Paket",
                            id: "subs-monitor",
                            url: `/admin/subscriptions/monitor`
                        },
                        { title: "Akan Expire", id: "subs-expiring", badge: "8", url: `/admin/subscriptions/expiring` },
                    ],
                },
                {
                    title: "Pendapatan Platform",
                    id: "platform-income",
                    url: ``,
                    icon: Wallet,
                    items: [
                        { title: "Subscription Revenue", id: "income-subs", url: `/admin/platform-income/subs` },
                        { title: "App Fees (2%)", id: "income-fees", url: `/admin/platform-income/fees` }, // Dari Order.appFee
                    ]
                },
            ],
        },
        {
            label: "Operasional Platform",
            items: [
                {
                    title: "Global Banner",
                    id: "banners",
                    icon: Megaphone,
                    url: `/admin/banners`,
                },
                {
                    title: "System Logs",
                    id: "logs",
                    icon: FileText,
                    url: `/admin/logs`,
                },
                {
                    title: "Server Status",
                    id: "server",
                    icon: Server,
                    url: `/admin/server`,
                }
            ],
        },
        {
            label: "Settings",
            items: [
                {
                    title: "Platform Config",
                    id: "settings",
                    icon: Settings,
                    url: `/admin/settings`,
                },
            ],
        },
    ],
}