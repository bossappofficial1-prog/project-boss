"use client";

import * as React from "react";
import { addDays, format, setDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  onDateChange?: (date: DateRange) => void;
}
export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  // Default: Select last 30 days
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: date?.from || new Date(2023, 10, 1), // Mock start date (Nov 1, 2023) based on context
    to: date?.to || addDays(new Date(2023, 10, 1), 20),
  });

  React.useEffect(() => {
    if (date) {
      setDateRange(date);
    }
  }, [date]);

  const handleSelect = (newRange: DateRange | undefined) => {
    setDateRange(newRange);
    if (newRange?.from && newRange?.to) {
      onDateChange?.(newRange);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "h-9 w-full md:w-60 justify-start text-left font-normal border-border/50 bg-muted/30 text-xs",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span className="text-muted-foreground">
                Pilih Rentang Tanggal
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
