"use client";

import { useMemo } from "react";
import { Users, LayoutGrid, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format, addMinutes, parse } from "date-fns";
import { useGetTables } from "@/hooks/api/use-tables";
import { useReservations } from "@/hooks/api/use-reservations";

type TableAvailability = "available" | "reserved" | "occupied";

interface TableSlot {
  id: string;
  name: string;
  capacity: number;
  availability: TableAvailability;
  reservation?: {
    customerName: string;
    time: string;
  };
}

interface TableAvailabilityPickerProps {
  outletId: string;
  date?: Date;
  time?: string;
  duration?: number;
  value?: string;
  onChange?: (tableId: string) => void;
}

const AVAILABILITY_CONFIG: Record<
  TableAvailability,
  {
    label: string;
    border: string;
    bg: string;
    text: string;
    badge: string;
    selectable: boolean;
  }
> = {
  available: {
    label: "Tersedia",
    border: "border-border/50",
    bg: "bg-card",
    text: "text-foreground",
    badge: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    selectable: true,
  },
  reserved: {
    label: "Dipesan",
    border: "border-chart-4/30",
    bg: "bg-chart-4/5",
    text: "text-muted-foreground",
    badge: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    selectable: false,
  },
  occupied: {
    label: "Terisi",
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    text: "text-muted-foreground",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    selectable: false,
  },
};

function TableCard({
  table,
  isSelected,
  onSelect,
}: {
  table: TableSlot;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const cfg = AVAILABILITY_CONFIG[table.availability];

  return (
    <button
      type="button"
      disabled={!cfg.selectable}
      onClick={() => cfg.selectable && onSelect(table.id)}
      className={cn(
        "relative rounded-lg border p-3 text-left w-full",
        "flex flex-col gap-2",
        cfg.bg,
        cfg.selectable
          ? "cursor-pointer hover:border-primary/50"
          : "cursor-not-allowed opacity-70",
        isSelected
          ? "border-primary ring-1 ring-primary bg-primary/5"
          : cfg.border,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className={cn("h-3.5 w-3.5 shrink-0", cfg.text)} />
          <span className={cn("text-sm font-medium", cfg.text)}>
            {table.name}
          </span>
        </div>
        {isSelected && (
          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>{table.capacity} orang</span>
      </div>

      <Badge
        variant="outline"
        className={cn("text-xs rounded-sm self-start", cfg.badge)}
      >
        {cfg.label}
      </Badge>

      {table.reservation && (
        <div className="pt-1 border-t border-border/50 space-y-0.5">
          <p className="text-xs font-medium text-foreground truncate">
            {table.reservation.customerName}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{table.reservation.time}</span>
          </div>
        </div>
      )}
    </button>
  );
}

export function TableAvailabilityPicker({
  outletId,
  date,
  time,
  duration,
  value,
  onChange,
}: TableAvailabilityPickerProps) {
  const { data: dbTables } = useGetTables(outletId);
  const dateStr = date ? format(date, "yyyy-MM-dd") : undefined;
  const { data: reservations = [] } = useReservations(outletId, dateStr);

  const selectedStart = useMemo(() => {
    if (!date || !time) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    return parse(`${dateStr} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  }, [date, time]);

  const selectedEnd = useMemo(() => {
    if (!selectedStart || !duration) return null;
    return addMinutes(selectedStart, duration);
  }, [selectedStart, duration]);

  const tables: TableSlot[] = useMemo(() => {
    if (!dbTables) return [];

    return dbTables.map((t: any) => {
      const tableReservations = reservations.filter(
        (r: any) =>
          r.tableId === t.id &&
          (r.orderStatus === "RESERVED" ||
            r.orderStatus === "ON_GOING" ||
            r.orderStatus === "PROCESSING" ||
            r.orderStatus === "CONFIRMED"),
      );

      let isTimeConflict = false;
      let conflictRes: any = null;

      if (selectedStart && selectedEnd) {
        for (const res of tableReservations) {
          const resStart = new Date(res.bookingDate);
          const resEnd = new Date(
            resStart.getTime() + res.bookingDurationMinutes * 60000,
          );

          if (resStart < selectedEnd && resEnd > selectedStart) {
            isTimeConflict = true;
            conflictRes = res;
            break;
          }
        }
      }

      const isLiveOccupied = t.status === "OCCUPIED";

      let availability: TableAvailability;
      if (isTimeConflict) {
        availability = "reserved";
      } else if (isLiveOccupied) {
        availability = "occupied";
      } else {
        availability = "available";
      }

      return {
        id: t.id,
        name: t.name,
        capacity: t.capacity || 4,
        availability,
        reservation: conflictRes
          ? {
              customerName: conflictRes.guestCustomer?.name || "-",
              time: `${format(new Date(conflictRes.bookingDate), "HH:mm")} – ${format(
                addMinutes(
                  new Date(conflictRes.bookingDate),
                  conflictRes.bookingDurationMinutes,
                ),
                "HH:mm",
              )}`,
            }
          : undefined,
      };
    });
  }, [dbTables, reservations, selectedStart, selectedEnd]);

  const availableCount = tables.filter(
    (t) => t.availability === "available",
  ).length;

  const endTime = useMemo(() => {
    if (!time || !duration) return null;
    try {
      const parsed = parse(time, "HH:mm", new Date());
      return format(addMinutes(parsed, duration), "HH:mm");
    } catch {
      return null;
    }
  }, [time, duration]);

  if (!date || !time) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
        <LayoutGrid className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Pilih tanggal dan jam reservasi terlebih dahulu untuk melihat
          ketersediaan meja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {format(date, "EEEE, d MMMM yyyy")} ·{" "}
          <span className="font-medium text-foreground">
            {time}
            {endTime ? ` – ${endTime}` : ""}
          </span>
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {Object.entries(AVAILABILITY_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <div
                className={cn("h-2 w-2 rounded-sm border", cfg.bg, cfg.border)}
              />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {availableCount} dari {tables.length} meja tersedia
        {value && (
          <span className="text-primary font-medium ml-1">
            · {tables.find((t) => t.id === value)?.name} dipilih
          </span>
        )}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            isSelected={value === table.id}
            onSelect={(id) => onChange?.(id)}
          />
        ))}
      </div>
    </div>
  );
}
