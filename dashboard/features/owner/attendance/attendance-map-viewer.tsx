"use client";

import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin } from "lucide-react";

interface MapPosition {
  lat: number;
  lng: number;
}

interface AttendanceMapViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clockIn?: MapPosition | null;
  clockOut?: MapPosition | null;
  staffName?: string;
}

function getCenter(clockIn?: MapPosition | null, clockOut?: MapPosition | null): [number, number] {
  const pos = clockIn || clockOut;
  if (pos) return [pos.lng, pos.lat];
  return [106.8456, -6.2088];
}

export function AttendanceMapViewer({
  open,
  onOpenChange,
  clockIn,
  clockOut,
  staffName,
}: AttendanceMapViewerProps) {
  if (!clockIn && !clockOut) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Lokasi Absensi{staffName ? ` - ${staffName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="h-72 rounded-lg overflow-hidden border">
          <Map center={getCenter(clockIn, clockOut)} zoom={15}>
            {clockIn && (
              <MapMarker longitude={clockIn.lng} latitude={clockIn.lat}>
                <MarkerContent>
                  <div className="flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                    <MapPin className="h-3 w-3" />
                    Masuk
                  </div>
                </MarkerContent>
              </MapMarker>
            )}
            {clockOut && (
              <MapMarker longitude={clockOut.lng} latitude={clockOut.lat}>
                <MarkerContent>
                  <div className="flex items-center gap-1 rounded-md bg-blue-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                    <MapPin className="h-3 w-3" />
                    Pulang
                  </div>
                </MarkerContent>
              </MapMarker>
            )}
          </Map>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {clockIn && (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Absen Masuk</p>
              <p className="font-mono text-muted-foreground">
                {clockIn.lat.toFixed(6)}, {clockIn.lng.toFixed(6)}
              </p>
            </div>
          )}
          {clockOut && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-2.5">
              <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Absen Pulang</p>
              <p className="font-mono text-muted-foreground">
                {clockOut.lat.toFixed(6)}, {clockOut.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
