import { SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AdminSidebar";
import { SiteHeader } from "./SiteHeader";
import { Toaster } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 5000, // No auto-close
                }}
            />
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