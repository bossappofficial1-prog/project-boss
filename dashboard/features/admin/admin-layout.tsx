"use client";

import { SidebarInset, SidebarProvider, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "./admin-sidebar";
import { SiteHeader } from "./admin-header";
import { GooeyToaster } from "goey-toast";
import { useAuthGuard } from "../auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading: isLoading } = useAuthGuard({ requiredRole: 'ADMIN' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-poppins">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <GooeyToaster position="top-right" />
      <AppSidebar />
      <SidebarRail />
      <SidebarInset className="bg-background">
        <SiteHeader />
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-3 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
