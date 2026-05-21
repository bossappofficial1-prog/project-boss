"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/manager/outlets");
  }, [router]);

  return null;
}
