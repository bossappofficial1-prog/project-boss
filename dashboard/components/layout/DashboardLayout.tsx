'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { OutletProvider } from '@/components/providers/OutletProvider';
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { type UserRole } from '@/lib/auth';
import Loading from '../ui/loading';

interface LayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function DashboardLayout({ children, requiredRole }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { loading: isLoading } = useAuthGuard({
    requiredRole,
    onboardingCheck: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) return <Loading />

  return (
    <OutletProvider>
      <SidebarProvider defaultOpen={true}>
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

        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            duration: 5000,
          }}
        />
      </SidebarProvider>
    </OutletProvider>
  );
}