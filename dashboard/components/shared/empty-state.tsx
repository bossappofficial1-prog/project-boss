import { cn } from "@/lib/utils";
import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  fullHeight?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  fullHeight,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        fullHeight ? "h-120" : "h-64",
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
