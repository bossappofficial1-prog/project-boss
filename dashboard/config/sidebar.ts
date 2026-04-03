import { apiClient } from "@/lib/ApiClient"
import {
    BarChart3,
    CreditCard,
    LayoutDashboard,
    Megaphone,
    Server,
    Settings,
    ShieldCheck,
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
    status?: "beta"
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
                        { title: "Paket Harga", id: "subs-plans", url: `/admin/subscriptions/plans` },
                    ],
                },
                {
                    title: "Pendapatan Platform",
                    id: "platform-income",
                    url: ``,
                    icon: Wallet,
                    items: [
                        { title: "Subscription Revenue", id: "income-subs", url: `/admin/platform-income/subs` },
                    ]
                },
            ],
        },
        {
            label: "Reports",
            items: [
                {
                    title: "Financial Reports",
                    id: "reports",
                    icon: BarChart3,
                    url: `/admin/reports`
                },
            ],
        },
        {
            label: "Validasi Pembayaran",
            items: [
                {
                    title: "Bukti Langganan",
                    id: "subscription-invoices",
                    icon: ShieldCheck,
                    badge: "Live",
                    url: `/admin/payments/manual`
                }
            ]
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
                    title: "Server Status",
                    id: "server",
                    icon: Server,
                    status: "beta",
                    url: `/admin/server`,
                }
            ],
        },
        {
            label: "System Health",
            items: [
                {
                    title: "System Monitor",
                    id: "system",
                    icon: ShieldCheck,
                    status: "beta",
                    url: `/admin/system`,
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
                    status: "beta",
                    url: `/admin/settings`,
                },
            ],
        },
    ],
}