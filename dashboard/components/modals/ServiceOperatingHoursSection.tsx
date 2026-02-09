"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfoIcon, Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { useOperatingHours } from "@/hooks/useOperatingHours";

interface ServiceOperatingHoursData {
  mondayOpen?: Date | null;
  mondayClose?: Date | null;
  tuesdayOpen?: Date | null;
  tuesdayClose?: Date | null;
  wednesdayOpen?: Date | null;
  wednesdayClose?: Date | null;
  thursdayOpen?: Date | null;
  thursdayClose?: Date | null;
  fridayOpen?: Date | null;
  fridayClose?: Date | null;
  saturdayOpen?: Date | null;
  saturdayClose?: Date | null;
  sundayOpen?: Date | null;
  sundayClose?: Date | null;
}

interface Props {
  outletId: string;
  value?: ServiceOperatingHoursData;
  onChange: (value: ServiceOperatingHoursData) => void;
}

// Map day number to field names
const DAY_MAP: {
  [key: number]: { open: keyof ServiceOperatingHoursData; close: keyof ServiceOperatingHoursData };
} = {
  1: { open: "mondayOpen", close: "mondayClose" },
  2: { open: "tuesdayOpen", close: "tuesdayClose" },
  3: { open: "wednesdayOpen", close: "wednesdayClose" },
  4: { open: "thursdayOpen", close: "thursdayClose" },
  5: { open: "fridayOpen", close: "fridayClose" },
  6: { open: "saturdayOpen", close: "saturdayClose" },
  0: { open: "sundayOpen", close: "sundayClose" },
};

const DAYS_OF_WEEK = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

export default function ServiceOperatingHoursSection({ outletId, value = {}, onChange }: Props) {
  const [initialized, setInitialized] = useState(false);

  // Fetch outlet operating hours
  const { data: outletHours, isLoading } = useOperatingHours(outletId);

  // Convert outlet hours to service hours format
  const convertOutletHoursToServiceHours = (outletHours: any[]): ServiceOperatingHoursData => {
    const result: ServiceOperatingHoursData = {};

    outletHours.forEach((oh) => {
      const fields = DAY_MAP[oh.dayOfWeek];
      if (oh.isOpen && fields) {
        // Create Date objects with just time component
        const baseDate = new Date("2000-01-01");
        const openDate = new Date(oh.openTime);
        const closeDate = new Date(oh.closeTime);

        const open = new Date(baseDate);
        open.setHours(openDate.getHours(), openDate.getMinutes(), 0, 0);

        const close = new Date(baseDate);
        close.setHours(closeDate.getHours(), closeDate.getMinutes(), 0, 0);

        result[fields.open] = open;
        result[fields.close] = close;
      } else if (fields) {
        result[fields.open] = null;
        result[fields.close] = null;
      }
    });

    return result;
  };

  // Auto-fill with outlet hours on mount (only if value is empty and not yet initialized)
  useEffect(() => {
    if (!outletHours || initialized || isLoading) return;

    // Check if value is empty (all fields are undefined/null)
    const isEmpty =
      Object.keys(value).length === 0 ||
      Object.values(value).every((v) => v === null || v === undefined);

    if (isEmpty) {
      const serviceHours = convertOutletHoursToServiceHours(outletHours);
      onChange(serviceHours);
      setInitialized(true);
    } else {
      setInitialized(true);
    }
  }, [outletHours, isLoading, initialized]);

  // Handle "Copy from Outlet" button
  const handleCopyFromOutlet = () => {
    if (!outletHours) return;
    const serviceHours = convertOutletHoursToServiceHours(outletHours);
    onChange(serviceHours);
    toast.success("Jam operasional outlet berhasil disalin!");
  };

  const hasAnyHours = useMemo(() => {
    return Object.values(value).some((v) => v !== null && v !== undefined);
  }, [value]);

  // Convert Date to HH:MM string for input
  const dateToTimeString = (date: Date | null | undefined): string => {
    if (!date) return "09:00";
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Convert HH:MM string to Date
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date("2000-01-01");
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  // Handle field change
  const handleFieldChange = (field: keyof ServiceOperatingHoursData, timeValue: string | null) => {
    const newValue = {
      ...value,
      [field]: timeValue ? timeStringToDate(timeValue) : null,
    };
    onChange(newValue);
  };

  // Check if a day is open
  const isDayOpen = (dayValue: number): boolean => {
    const fields = DAY_MAP[dayValue];
    const openTime = value[fields.open];
    const closeTime = value[fields.close];
    return !!(openTime && closeTime);
  };

  // Toggle day open/close
  const toggleDay = (dayValue: number, isOpen: boolean) => {
    const fields = DAY_MAP[dayValue];

    if (isOpen) {
      // Set default times
      const newValue = {
        ...value,
        [fields.open]: timeStringToDate("09:00"),
        [fields.close]: timeStringToDate("17:00"),
      };
      onChange(newValue);
    } else {
      // Set to null
      const newValue = {
        ...value,
        [fields.open]: null,
        [fields.close]: null,
      };
      onChange(newValue);
    }
  };

  if (isLoading && !initialized) {
    return (
      <Card className="border-blue-100 dark:border-blue-900/50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Memuat jam operasional...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-100 dark:border-blue-900/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <CardTitle className="text-base">Jam Operasional Layanan</CardTitle>
              <CardDescription className="text-sm mt-1">
                Default sama dengan jam outlet, bisa diubah sesuai kebutuhan
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyFromOutlet}
            disabled={isLoading || !outletHours}
            className="gap-2 shrink-0">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy dari Outlet</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasAnyHours && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Jam operasional belum diatur. Booking slot tidak akan tersedia hingga jam operasional
              di-set.
            </AlertDescription>
          </Alert>
        )}

        {/* Day-by-day time inputs */}
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const isOpen = isDayOpen(day.value);
            const fields = DAY_MAP[day.value];
            const openTime = dateToTimeString(value[fields.open]);
            const closeTime = dateToTimeString(value[fields.close]);

            return (
              <div key={day.value} className="group relative">
                <div className="flex flex-col p-4 rounded-xl bg-linear-to-r from-gray-50 to-gray-50/80 dark:from-gray-800/50 dark:to-gray-800/30 gap-3 sm:gap-4 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm">
                  <div className="flex justify-between items-center gap-3 sm:gap-4 min-w-0">
                    <Label className="w-16 sm:w-20 font-semibold text-sm sm:text-base shrink-0 text-gray-700 dark:text-gray-300">
                      {day.label}
                    </Label>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isOpen}
                        onCheckedChange={(checked) => toggleDay(day.value, checked)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                          isOpen
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                        <div
                          className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        {isOpen ? "Buka" : "Tutup"}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center w-full gap-3 transition-all duration-300 ${
                      isOpen
                        ? "opacity-100 translate-x-0"
                        : "opacity-30 pointer-events-none translate-x-2"
                    }`}>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <Input
                        type="time"
                        className="w-24 sm:w-28 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                        value={openTime}
                        onChange={(e) => handleFieldChange(fields.open, e.target.value)}
                        disabled={!isOpen}
                      />
                      <span className="text-gray-400 font-medium">—</span>
                      <Input
                        type="time"
                        className="w-24 sm:w-28 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                        value={closeTime}
                        onChange={(e) => handleFieldChange(fields.close, e.target.value)}
                        disabled={!isOpen}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
