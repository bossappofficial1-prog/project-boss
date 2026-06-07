"use client";

import { apiClient } from "@/lib/apis/base";
import { useState, useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/theme-toggle";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function ManagerHeader() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { toggleSidebar, state } = useSidebar();

  const { data: cashierData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["cashier-auth"],
    queryFn: () => authApi.cashierMe(),
    staleTime: 5 * 60_000,
  });

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLogoutLoading(true);
      const res = await apiClient.post("/auth/logout");
      if (res.status === 200) {
        try {
          sessionStorage.removeItem("cashier-auth-cache-v1");
        } catch {}
        window.location.href = "/auth/login/cashier";
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return "M";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const privilegesList = useMemo(() => {
    const rawPrivileges = cashierData?.privileges || [];
    return rawPrivileges.map((p: any) => p.privilege || p);
  }, [cashierData]);
  const hasPrivileges = privilegesList.length > 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-300 dark:border-gray-600 bg-background/60 backdrop-blur-lg px-4 lg:px-6">
      {/* Left Section - Sidebar Toggle */}
      {hasPrivileges && (
        <div className="flex items-center gap-2">
          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden text-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Desktop Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex text-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            {state === "collapsed" ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle sidebar collapse</span>
          </Button>
        </div>
      )}

      {/* Outlet name indicator */}
      {!isAuthLoading && cashierData?.outlet && (
        <div className="hidden md:flex items-center gap-2 bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary truncate max-w-48">
            Outlet: {cashierData.outlet.name}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        <Separator orientation="vertical" className="h-8 hidden sm:block" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 gap-2 rounded-xl px-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Avatar className="h-8 w-8 bg-linear-to-br from-primary to-primary/80 shadow-md">
                <AvatarFallback className="bg-transparent text-white text-sm font-black">
                  {isAuthLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    getUserInitials(cashierData?.name)
                  )}
                </AvatarFallback>
              </Avatar>

              {/* User Info - Hidden on mobile */}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {isAuthLoading
                    ? "Loading..."
                    : cashierData?.name || "Manager"}
                </span>
                <span className="text-xs text-primary font-medium">
                  Manager Outlet
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl shadow-xl border-gray-100 dark:border-gray-700"
          >
            {/* User Info Header */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {isAuthLoading
                    ? "Loading..."
                    : cashierData?.name || "Manager"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {isAuthLoading ? "..." : cashierData?.email || "No email"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-semibold text-primary">
                    Manager
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogoutClick}
              className="cursor-pointer gap-2 py-2.5 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari akun manager Anda? Anda akan diarahkan ke halaman login kasir."
        confirmText={logoutLoading ? "Loading..." : "Keluar"}
        cancelText="Batal"
        confirmVariant="destructive"
        onConfirm={handleLogoutConfirm}
        confirmDisabled={logoutLoading}
        icon={<LogOut className="h-6 w-6 text-red-600" />}
      />
    </header>
  );
}
