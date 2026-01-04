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
    ServerCog,
    Settings,
    ShoppingCart,
    Users,
    type LucideIcon
} from "lucide-react"

export type SidebarItem = {
    title: string
    url: string // Menggunakan 'url' atau 'href' untuk routing
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
            label: "Main",
            items: [
                { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
                { title: "Overview", url: "/admin/overview", icon: BarChart3, badge: "New" },
            ],
        },

        {
            label: "Platform",
            items: [
                { title: "Users", url: "/admin/users", icon: Users },
                { title: "Businesses", url: "/admin/businesses", icon: Folder },
                {
                    title: "Outlets & Staff",
                    url: "/admin/outlets",
                    icon: ShoppingCart,
                    items: [
                        { title: "Outlets", url: "/admin/outlets", icon: ShoppingCart },
                        { title: "Staff", url: "/admin/staff", icon: Users },
                        { title: "Operating Hours", url: "/admin/outlets/hours", icon: Calendar },
                    ],
                },
                { title: "Orders", url: "/admin/orders", icon: FileText },
                { title: "Transactions (Audit)", url: "/admin/transactions", icon: CreditCard },
            ],
        },

        {
            label: "Finance",
            items: [
                { title: "Withdrawals & Payouts", url: "/admin/withdrawals", icon: FilePlus },
                { title: "Wallets", url: "/admin/wallets", icon: FileSearch },
                { title: "Reports & Exports", url: "/admin/reports", icon: BarChart3 },
            ],
        },

        {
            label: "Support & Config",
            items: [
                { title: "Support Tickets", url: "/admin/support", icon: Mail },
                { title: "Platform Settings", url: "/admin/settings", icon: Settings },
                { title: "Integrations", url: "/admin/integrations", icon: ServerCog },
            ],
        },

        {
            label: "Ops & Compliance",
            items: [
                { title: "System Health", url: "/admin/system", icon: ServerCog },
                { title: "Audit Logs", url: "/admin/audit", icon: FileText },
                { title: "Marketing (platform)", url: "/admin/marketing", icon: Folder },
            ],
        },
    ],
}