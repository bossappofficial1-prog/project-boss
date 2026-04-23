"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Business Profile Skeleton */}
      <Card className="gap-0 py-0 rounded-md overflow-hidden border-border/80 bg-background shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted/80 rounded-md animate-pulse" />
              <div className="h-3 w-48 bg-muted rounded-md animate-pulse opacity-50" />
            </div>
          </div>
          <div className="h-9 w-24 bg-muted border border-border rounded-md animate-pulse" />
        </div>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
            <div className="lg:col-span-7 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><div className="h-2 w-16 bg-muted rounded-md" /><div className="h-4 w-32 bg-muted rounded-md" /></div>
                <div className="space-y-2"><div className="h-2 w-16 bg-muted rounded-md" /><div className="h-4 w-24 bg-muted rounded-md" /></div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-2 w-20 bg-muted rounded-md" />
                <div className="h-12 w-full bg-muted rounded-md opacity-50" />
              </div>
            </div>
            <div className="lg:col-span-5 p-6 bg-muted/20 flex items-center justify-center">
              <div className="h-40 w-full max-w-[320px] rounded-md bg-muted animate-pulse border border-border/40 shadow-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-md border-border/80 bg-background shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
                <div className="h-5 w-5 rounded-md bg-muted animate-pulse opacity-30" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-16 bg-muted opacity-50" />
                <div className="h-7 w-24 bg-muted animate-pulse" />
              </div>
              <div className="h-2 w-32 bg-muted opacity-30" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outlets Section Skeleton */}
      <Card className="gap-0 py-0 rounded-md overflow-hidden border-border/80 bg-background shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted/80 rounded-md animate-pulse" />
              <div className="h-3 w-56 bg-muted rounded-md animate-pulse opacity-50" />
            </div>
          </div>
          <div className="h-9 w-28 bg-muted border border-border rounded-md animate-pulse" />
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 rounded-md border border-border/60 bg-background space-y-4 opacity-70 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-md bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted/80 rounded-md" />
                    <div className="h-2 w-1/2 bg-muted rounded-md" />
                  </div>
                </div>
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="h-4 w-12 bg-muted rounded-md" />
                  <div className="flex gap-2">
                    <div className="h-7 w-7 bg-muted rounded-md" />
                    <div className="h-7 w-7 bg-muted rounded-md" />
                  </div>
                </div>
                <div className="h-8 w-full bg-muted/20 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
