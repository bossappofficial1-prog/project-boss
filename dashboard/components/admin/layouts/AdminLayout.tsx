import { SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AdminSidebar";
import { Bell, Search } from "lucide-react";
import { SiteHeader } from "./SiteHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen>
            <AppSidebar />
            <SidebarRail />
            <SidebarInset className="bg-background">
                <SiteHeader />
                <div className="flex-1 overflow-y-auto p-3 md:p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}