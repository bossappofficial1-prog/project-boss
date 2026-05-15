"use client";

import { DateRange } from "react-day-picker";
import { subMonths, startOfDay, endOfDay } from "date-fns";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { useStoreState } from "@/stores/use-state";

type Preset = "1m" | "3m" | "9m" | "custom";

interface DateRangeFilterProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "9m", label: "9M" },
  { key: "custom", label: "Custom" },
];

function getPresetRange(preset: Exclude<Preset, "custom">): DateRange {
  const to = endOfDay(new Date());
  const monthsMap: Record<Exclude<Preset, "custom">, number> = {
    "1m": 1,
    "3m": 3,
    "9m": 9,
  };
  return {
    from: startOfDay(subMonths(to, monthsMap[preset])),
    to,
  };
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { dateRangeFilter, setDateRangeFilter, dateRange, setDateRange } =
    useStoreState();

  const handlePreset = (preset: Preset) => {
    setDateRangeFilter(preset);
    if (preset !== "custom") {
      onChange(getPresetRange(preset));
    }
  };

  const handleCustomChange = (range: DateRange | undefined) => {
    setDateRangeFilter("custom");
    setDateRange(range);
    onChange(range);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Preset buttons */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePreset(preset.key)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
              dateRangeFilter === preset.key
                ? "bg-primary shadow-sm text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date picker — only visible when custom is active */}
      {dateRangeFilter === "custom" && (
        <DatePickerWithRange
          date={dateRange ?? value}
          onDateChange={handleCustomChange}
        />
      )}
    </div>
  );
}
