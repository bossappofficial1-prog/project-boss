"use client";

import React, { useEffect, useState } from "react";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import AppBar from "./shared/AppBar";
import { usePathname } from "next/navigation";

function AppBarV2() {
  const { appBarConfig } = useAppBarV2();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hiddenRoutes = [
    "/login",
    "/register",
    "/onboarding",
    "/splash",
    "/profile",
    "/payment/success",
    "/payment/processing",
    "/payment/failed",
    "/payment/cancelled",
    "/payment/expired",
    "/payment/pending",
  ];

  if (hiddenRoutes.includes(pathname)) return null;

  // Prevent hydration mismatch by not rendering until mounted
  // The appBarConfig is set via useEffect in page components,
  // causing server (initial state) vs client (updated state) differences
  if (!mounted) return null;

  return <AppBar {...appBarConfig} />;
}

export default AppBarV2;
