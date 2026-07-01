"use client";

import { useState } from "react";
import {
  format,
  addDays,
  addMonths,
  addYears,
  startOfWeek,
  endOfWeek,
  parseISO,
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

export type PeriodValue =
  | { type: "daily"; date: string } // format: yyyy-MM-dd
  | { type: "weekly"; startDate: string; endDate: string } // format: yyyy-MM-dd
  | { type: "monthly"; month: number; year: number } // month: 1-12
  | { type: "yearly"; year: number };

type PeriodPickerProps = {
  granularity: PeriodGranularity;
  value: PeriodValue;
  onValueChange: (value: PeriodValue) => void;
  className?: string;
};

function generatePeriodValue(
  granularity: PeriodGranularity,
  date: Date,
): PeriodValue {
  switch (granularity) {
    case "daily":
      return { type: "daily", date: format(date, "yyyy-MM-dd") };
    case "weekly":
      return {
        type: "weekly",
        startDate: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "monthly":
      return {
        type: "monthly",
        month: date.getMonth() + 1, // +1 agar bulan dimulai dari 1 (Jan) - 12 (Des)
        year: date.getFullYear(),
      };
    case "yearly":
      return { type: "yearly", year: date.getFullYear() };
  }
}

function getInternalDate(value: PeriodValue): Date {
  switch (value.type) {
    case "daily":
      return parseISO(value.date);
    case "weekly":
      return parseISO(value.startDate);
    case "monthly":
      return new Date(value.year, value.month - 1, 1);
    case "yearly":
      return new Date(value.year, 0, 1);
  }
}

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

  const internalDate = getInternalDate(value);

  const handlePrev = () => {
    const newDate = shiftDate(granularity, internalDate, -1);
    onValueChange(generatePeriodValue(granularity, newDate));
  };

  const handleNext = () => {
    const newDate = shiftDate(granularity, internalDate, 1);
    onValueChange(generatePeriodValue(granularity, newDate));
  };

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
            {getLabel(granularity, internalDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          {granularity === "daily" && (
            <Calendar
              mode="single"
              selected={internalDate}
              onSelect={(date) => {
                if (!date) return;
                onValueChange(generatePeriodValue("daily", date));
                setOpen(false);
              }}
              locale={localeId}
              initialFocus
            />
          )}

          {granularity === "weekly" && (
            <Calendar
              mode="single"
              selected={internalDate}
              onSelect={(date) => {
                if (!date) return;
                onValueChange(generatePeriodValue("weekly", date));
                setOpen(false);
              }}
              locale={localeId}
              weekStartsOn={1}
              modifiers={{
                selectedWeek: (date) => {
                  const start = startOfWeek(internalDate, { weekStartsOn: 1 });
                  const end = endOfWeek(internalDate, { weekStartsOn: 1 });
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
              value={internalDate}
              onChange={(date) => {
                onValueChange(generatePeriodValue("monthly", date));
                setOpen(false);
              }}
            />
          )}

          {granularity === "yearly" && (
            <YearPicker
              value={internalDate}
              onChange={(date) => {
                onValueChange(generatePeriodValue("yearly", date));
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
