"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Palette } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export function AppearanceSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Tampilan
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sesuaikan tampilan dashboard agar nyaman digunakan.
        </p>
      </div>

      <Card className="shadow-sm gap-0 border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Tema Dashboard</CardTitle>
          <CardDescription>
            Pilih tema warna yang sesuai dengan preferensi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/20">
              <div>
                <p className="text-sm font-medium">Mode Tema</p>
                <p className="text-xs text-muted-foreground">
                  Terang, gelap, atau ikuti sistem
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/60 bg-background cursor-default">
                <div className="w-full h-16 rounded-md bg-white border border-gray-200 shadow-sm">
                  <div className="h-3 w-full bg-gray-100 rounded-t-md" />
                  <div className="p-1.5 space-y-1">
                    <div className="h-1.5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-1.5 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Terang
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/60 bg-background cursor-default">
                <div className="w-full h-16 rounded-md bg-gray-900 border border-gray-700 shadow-sm">
                  <div className="h-3 w-full bg-gray-800 rounded-t-md" />
                  <div className="p-1.5 space-y-1">
                    <div className="h-1.5 w-3/4 bg-gray-700 rounded" />
                    <div className="h-1.5 w-1/2 bg-gray-800 rounded" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Gelap
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/60 bg-background cursor-default">
                <div className="w-full h-16 rounded-md bg-linear-to-br from-white to-gray-900 border border-gray-300 shadow-sm">
                  <div className="h-3 w-full bg-linear-to-r from-gray-100 to-gray-800 rounded-t-md" />
                  <div className="p-1.5 space-y-1">
                    <div className="h-1.5 w-3/4 bg-linear-to-r from-gray-200 to-gray-700 rounded" />
                    <div className="h-1.5 w-1/2 bg-linear-to-r from-gray-100 to-gray-800 rounded" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Sistem
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
