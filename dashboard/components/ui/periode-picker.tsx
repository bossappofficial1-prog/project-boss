"use client";

import { useState } from "react";
import {
  format,
  addDays,
  addMonths,
  addYears,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type PeriodGranularity = "daily" | "weekly" | "monthly" | "yearly";

type PeriodPickerProps = {
  granularity: PeriodGranularity;
  value: Date;
  onValueChange: (date: Date) => void;
  className?: string;
};

function getWeekLabel(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${format(start, "d", { locale: localeId })} - ${format(end, "d MMM yyyy", { locale: localeId })}`
    : `${format(start, "d MMM", { locale: localeId })} - ${format(end, "d MMM yyyy", { locale: localeId })}`;
}

function getLabel(granularity: PeriodGranularity, date: Date) {
  switch (granularity) {
    case "daily":
      return format(date, "d MMMM yyyy", { locale: localeId });
    case "weekly":
      return getWeekLabel(date);
    case "monthly":
      return format(date, "MMMM yyyy", { locale: localeId });
    case "yearly":
      return format(date, "yyyy", { locale: localeId });
  }
}

function shiftDate(
  granularity: PeriodGranularity,
  date: Date,
  direction: 1 | -1,
) {
  switch (granularity) {
    case "daily":
      return addDays(date, direction);
    case "weekly":
      return addDays(date, direction * 7);
    case "monthly":
      return addMonths(date, direction);
    case "yearly":
      return addYears(date, direction);
  }
}

export function PeriodPicker({
  granularity,
  value,
  onValueChange,
  className,
}: PeriodPickerProps) {
  const [open, setOpen] = useState(false);

  const handlePrev = () => onValueChange(shiftDate(granularity, value, -1));
  const handleNext = () => onValueChange(shiftDate(granularity, value, 1));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={handlePrev}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 gap-2 font-normal">
            <CalendarIcon className="size-4 text-muted-foreground" />
            {getLabel(granularity, value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          {granularity === "daily" && (
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                if (!date) return;
                onValueChange(date);
                setOpen(false);
              }}
              locale={localeId}
              initialFocus
            />
          )}

          {granularity === "weekly" && (
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                if (!date) return;
                onValueChange(date);
                setOpen(false);
              }}
              locale={localeId}
              weekStartsOn={1}
              modifiers={{
                selectedWeek: (date) => {
                  const start = startOfWeek(value, { weekStartsOn: 1 });
                  const end = endOfWeek(value, { weekStartsOn: 1 });
                  return date >= start && date <= end;
                },
              }}
              modifiersClassNames={{
                selectedWeek: "bg-accent text-accent-foreground",
              }}
              initialFocus
            />
          )}

          {granularity === "monthly" && (
            <MonthPicker
              value={value}
              onChange={(date) => {
                onValueChange(date);
                setOpen(false);
              }}
            />
          )}

          {granularity === "yearly" && (
            <YearPicker
              value={value}
              onChange={(date) => {
                onValueChange(date);
                setOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={handleNext}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function MonthPicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [year, setYear] = useState(value.getFullYear());
  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(year, i, 1), "MMM", { locale: localeId }),
  );

  return (
    <div className="p-3 w-64">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setYear((y) => y - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">{year}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setYear((y) => y + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((label, i) => {
          const isSelected =
            value.getFullYear() === year && value.getMonth() === i;
          return (
            <Button
              key={label}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              className="capitalize"
              onClick={() => onChange(new Date(year, i, 1))}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function YearPicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [decadeStart, setDecadeStart] = useState(
    Math.floor(value.getFullYear() / 10) * 10,
  );
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);

  return (
    <div className="p-3 w-64">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setDecadeStart((y) => y - 10)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {decadeStart} - {decadeStart + 9}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setDecadeStart((y) => y + 10)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((y) => {
          const isSelected = value.getFullYear() === y;
          const isOutsideDecade = y < decadeStart || y > decadeStart + 9;
          return (
            <Button
              key={y}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              className={cn(isOutsideDecade && "text-muted-foreground")}
              onClick={() => onChange(new Date(y, 0, 1))}
            >
              {y}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
