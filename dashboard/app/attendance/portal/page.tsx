"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { GooeyToaster } from "goey-toast";

import { PortalInner } from "@/features/attendance-portal";

export default function AttendancePortalPage() {
  return (
    <>
      <GooeyToaster richColors position="top-center" />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <PortalInner />
      </Suspense>
    </>
  );
}
