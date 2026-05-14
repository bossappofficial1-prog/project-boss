import { useState } from "react";
import { formatHour } from "./utils";

export function HeatmapCell({
  value,
  maxValue,
  hour,
  dayName,
  displayLabel,
}: {
  value: number;
  maxValue: number;
  hour: number;
  dayName: string;
  displayLabel: string;
}) {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  const [hovered, setHovered] = useState(false);

  const getBg = () => {
    if (value === 0) return "bg-muted";
    if (intensity > 0.8) return "bg-primary";
    if (intensity > 0.6) return "bg-primary/75";
    if (intensity > 0.4) return "bg-primary/50";
    if (intensity > 0.2) return "bg-primary/30";
    return "bg-primary/15";
  };

  return (
    <div className="relative group">
      <div
        className={`h-7 rounded-sm flex items-center justify-center cursor-default transition-opacity ${getBg()} ${hovered ? "ring-1 ring-primary ring-offset-1" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {hovered && value > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 bg-popover border border-border shadow-md rounded-md px-2 py-1 whitespace-nowrap pointer-events-none">
          <p className="text-xs font-medium">
            {dayName} {formatHour(hour)}
          </p>
          <p className="text-xs text-muted-foreground">{displayLabel}</p>
        </div>
      )}
    </div>
  );
}
