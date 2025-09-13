'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    try {
      JSON.parse(user);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-poppins">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 flex font-poppins relative`}>
      <style jsx global>{`
        @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
        .animate-fadeIn { animation: fadeInOverlay 0.25s ease-out; }
      `}</style>
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay when sidebar is open - covers entire screen */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md lg:hidden animate-fadeIn z-30"
          style={{ 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            left: '0',
            right: '0',
            top: '0',
            bottom: '0'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col lg:ml-64 transition-all duration-300 ${sidebarOpen ? 'lg:scale-100' : 'scale-100'}`}>
        {/* Header */}
        <div className={`${sidebarOpen ? 'backdrop-blur-sm bg-white/60 lg:bg-transparent lg:backdrop-blur-none' : 'bg-transparent'} sticky top-0 z-20 transition-all dashboard-header`}>
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Content */}
        <main className={`flex-1 overflow-auto relative z-10 transition-all duration-300 ${sidebarOpen ? 'blur-[2px] lg:blur-0' : ''}`}>
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
