import { SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Bell, Search } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen>
            <AdminSidebar />
            <SidebarRail />
            <SidebarInset className="bg-background">
                <header className="sticky top-0 z-10 h-16 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64 max-w-full"
                            />
                        </div>
                    </div>
                    <button className="relative p-2 hover:bg-muted rounded-lg">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}