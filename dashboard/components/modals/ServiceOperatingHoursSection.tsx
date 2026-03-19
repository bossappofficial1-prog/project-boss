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

import { ServiceOperatingHours } from "@/hooks/useProductsData";
import { CopyDayPopover } from "../ui/OperatingHoursManager";

interface Props {
  outletId: string;
  value?: ServiceOperatingHours[];
  onChange: (value: ServiceOperatingHours[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

export default function ServiceOperatingHoursSection({ outletId, value = [], onChange }: Props) {
  const [initialized, setInitialized] = useState(false);

  // Fetch outlet operating hours
  const { data: outletHours, isLoading } = useOperatingHours(outletId);

  // Convert outlet hours to service hours format
  const convertOutletHoursToServiceHours = (outletHours: any[]): ServiceOperatingHours[] => {
    return outletHours.map((oh) => {
      // Create Date objects with just time component for proper formatting later
      const baseDate = new Date("2000-01-01");
      const openDate = new Date(oh.openTime);
      const closeDate = new Date(oh.closeTime);

      const open = new Date(baseDate);
      open.setHours(openDate.getHours(), openDate.getMinutes(), 0, 0);

      const close = new Date(baseDate);
      close.setHours(closeDate.getHours(), closeDate.getMinutes(), 0, 0);
      
      let restStart: Date | undefined = undefined;
      let restEnd: Date | undefined = undefined;

      if (oh.isRestEnabled) {
        if (oh.restStartTime) {
          const rsDate = new Date(oh.restStartTime);
          restStart = new Date(baseDate);
          restStart.setHours(rsDate.getHours(), rsDate.getMinutes(), 0, 0);
        } else {
          // Default fallbacks if rest enabled but not set
          restStart = new Date(baseDate);
          restStart.setHours(12, 0, 0, 0);
        }

        if (oh.restEndTime) {
          const reDate = new Date(oh.restEndTime);
          restEnd = new Date(baseDate);
          restEnd.setHours(reDate.getHours(), reDate.getMinutes(), 0, 0);
        } else {
          restEnd = new Date(baseDate);
          restEnd.setHours(13, 0, 0, 0);
        }
      }

      return {
        dayOfWeek: oh.dayOfWeek,
        isOpen: oh.isOpen,
        openTime: open,
        closeTime: close,
        isRestEnabled: oh.isRestEnabled || false,
        restStartTime: restStart,
        restEndTime: restEnd,
      };
    });
  };

  // Auto-fill with outlet hours on mount (only if value is empty and not yet initialized)
  useEffect(() => {
    if (!outletHours || initialized || isLoading) return;

    // Check if value is empty
    const isEmpty = !value || value.length === 0;

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
    return value && value.length > 0;
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

  // Get day data Helper
  const getDayData = (dayValue: number) => {
    return value.find((v) => v.dayOfWeek === dayValue);
  };

  // Handle field change
  const handleFieldChange = (dayValue: number, field: keyof ServiceOperatingHours, dataValue: any) => {
    const existingIdx = value.findIndex((v) => v.dayOfWeek === dayValue);
    
    let newValue = [...value];
    
    if (existingIdx >= 0) {
      if (field === 'openTime' || field === 'closeTime' || field === 'restStartTime' || field === 'restEndTime') {
        newValue[existingIdx] = {
            ...newValue[existingIdx],
            [field]: dataValue ? timeStringToDate(dataValue as string) : null,
        }
      } else {
        newValue[existingIdx] = {
            ...newValue[existingIdx],
            [field]: dataValue,
        }
      }
    } else {
      // Create new
      const baseObj = {
        dayOfWeek: dayValue,
        isOpen: field === 'isOpen' ? dataValue : false,
        isRestEnabled: field === 'isRestEnabled' ? dataValue : false,
        openTime: timeStringToDate("09:00"),
        closeTime: timeStringToDate("17:00"),
        restStartTime: timeStringToDate("12:00"),
        restEndTime: timeStringToDate("13:00"),
      };
      
      if (field === 'openTime' || field === 'closeTime' || field === 'restStartTime' || field === 'restEndTime') {
        newValue.push({
            ...baseObj,
            [field]: dataValue ? timeStringToDate(dataValue as string) : null,
        } as ServiceOperatingHours);
      } else {
        newValue.push({
            ...baseObj,
            [field]: dataValue,
        } as ServiceOperatingHours);
      }
    }
    
    onChange(newValue);
  };

  // Toggle day open/close
  const toggleDay = (dayValue: number, isOpen: boolean) => {
    handleFieldChange(dayValue, 'isOpen', isOpen);
  };

  const handleCopyToDays = (sourceDay: number, targetDays: number[]) => {
    const sourceData = getDayData(sourceDay);
    if (!sourceData) return;

    let newValue = [...value];

    targetDays.forEach((targetDay) => {
      const existingIdx = newValue.findIndex((v) => v.dayOfWeek === targetDay);
      const updatedData: ServiceOperatingHours = {
        dayOfWeek: targetDay,
        isOpen: sourceData.isOpen,
        openTime: sourceData.openTime,
        closeTime: sourceData.closeTime,
        isRestEnabled: sourceData.isRestEnabled,
        restStartTime: sourceData.restStartTime,
        restEndTime: sourceData.restEndTime,
      };

      if (existingIdx >= 0) {
        newValue[existingIdx] = updatedData;
      } else {
        newValue.push(updatedData);
      }
    });

    onChange(newValue);
    toast.success(`Jam layanan disalin ke ${targetDays.length} hari.`);
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
            size="lg"
            onClick={handleCopyFromOutlet}
            disabled={isLoading || !outletHours}
            className="gap-2 shrink-0 py-6">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">
              Sesuaikan dengan <br /> jadwal outlet
            </span>
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
            const dayData = getDayData(day.value);
            const isOpen = dayData?.isOpen || false;
            const openTime = dateToTimeString(dayData?.openTime as Date);
            const closeTime = dateToTimeString(dayData?.closeTime as Date);
            const isRestEnabled = dayData?.isRestEnabled || false;
            const restStartTime = dateToTimeString(dayData?.restStartTime as Date);
            const restEndTime = dateToTimeString(dayData?.restEndTime as Date);

            return (
              <div key={day.value} className="group relative">
                <div className="flex flex-col p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/80 dark:from-gray-800/50 dark:to-gray-800/30 gap-3 sm:gap-4 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm">
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
                    className={`flex flex-col items-start w-full gap-3 transition-all duration-300 ${
                      isOpen
                        ? "opacity-100 translate-x-0"
                        : "opacity-30 pointer-events-none translate-x-2"
                    }`}>
                    <div className="flex w-full items-center gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <Input
                          type="time"
                          className="w-24 sm:w-28 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                          value={openTime}
                          onChange={(e) => handleFieldChange(day.value, 'openTime', e.target.value)}
                          disabled={!isOpen}
                        />
                        <span className="text-gray-400 font-medium">—</span>
                        <Input
                          type="time"
                          className="w-24 sm:w-28 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                          value={closeTime}
                          onChange={(e) => handleFieldChange(day.value, 'closeTime', e.target.value)}
                          disabled={!isOpen}
                        />
                      </div>
                      <CopyDayPopover sourceDay={day.value} onCopyToDays={handleCopyToDays} />
                    </div>

                    {/* Rest Hours Section */}
                    {isOpen && (
                      <div className="flex w-full flex-col sm:flex-row items-start sm:items-center gap-3 mt-1 pl-1">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isRestEnabled}
                            onCheckedChange={(checked) => handleFieldChange(day.value, 'isRestEnabled', checked)}
                            className="scale-90 data-[state=checked]:bg-amber-500"
                          />
                          <Label className="text-sm text-gray-600 dark:text-gray-400">Jam Istirahat</Label>
                        </div>
                        
                        {isRestEnabled && (
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1.5 border border-amber-200 dark:border-amber-900 shadow-sm ml-0 sm:ml-2">
                            <Input
                              type="time"
                              className="w-20 sm:w-24 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none h-7"
                              value={restStartTime}
                              onChange={(e) => handleFieldChange(day.value, 'restStartTime', e.target.value)}
                            />
                            <span className="text-amber-400 font-medium text-xs">—</span>
                            <Input
                              type="time"
                              className="w-20 sm:w-24 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none h-7"
                              value={restEndTime}
                              onChange={(e) => handleFieldChange(day.value, 'restEndTime', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
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
