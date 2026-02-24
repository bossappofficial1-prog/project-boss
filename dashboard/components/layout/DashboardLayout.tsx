'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { OutletProvider } from '@/components/providers/OutletProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { Toaster } from 'sonner';
import { DashboardSocketListener } from '../sockets/DashboardSocketListener';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading: isLoading } = useAuthGuard();

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
    <OutletProvider>
      <DashboardSocketListener />
      <SidebarProvider defaultOpen={true}>
        <SocketProvider>
          <Sidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Header />

            {/* Main Content with Responsive Padding */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
              <div className="w-full mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 xl:p-10 2xl:p-12">
                {children}
              </div>
            </main>
          </SidebarInset>

          {/* Sonner Toaster for custom notifications */}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              duration: 5000,
            }}
          />
        </SocketProvider>
      </SidebarProvider>
    </OutletProvider>
  );
}