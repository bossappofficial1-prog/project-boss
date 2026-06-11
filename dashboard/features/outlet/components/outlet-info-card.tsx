"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface OutletInfoCardProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function OutletInfoCard({
  title,
  icon: Icon,
  description,
  children,
  action,
}: OutletInfoCardProps) {
  return (
    <Card className="shadow-sm gap-0 border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {description && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

interface OutletInfoFieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  truncate?: boolean;
  mono?: boolean;
  badge?: ReactNode;
}

export function OutletInfoField({
  icon: Icon,
  label,
  value,
  truncate = false,
  mono = false,
  badge,
}: OutletInfoFieldProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p
          className={cn(
            "text-sm font-medium text-foreground mt-0.5",
            truncate && "truncate",
            mono && "font-mono text-xs",
          )}
          title={value}
        >
          {value}
        </p>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

interface OutletStatusGridProps {
  items: Array<{
    label: string;
    value: string;
    variant: "success" | "destructive" | "outline" | "default";
  }>;
}

export function OutletStatusGrid({ items }: OutletStatusGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/40 bg-muted/10"
        >
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            {item.label}
          </span>
          <span
            className={cn(
              "text-xs font-bold",
              item.variant === "success" &&
                "text-emerald-600 dark:text-emerald-400",
              item.variant === "destructive" &&
                "text-rose-600 dark:text-rose-400",
              item.variant === "outline" && "text-muted-foreground",
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
