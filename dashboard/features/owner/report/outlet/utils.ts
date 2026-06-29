import { CompareFilterType, FilterType } from "./types";

export const formatPeriodLabel = (type: FilterType, date: Date): string => {
  if (type === "daily") {
    const start = new Date(date);
    start.setDate(date.getDate() - 9);
    return `${start.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} – ${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "weekly")
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return date.toLocaleDateString("id-ID", { year: "numeric" });
};

export const formatComparePeriodLabel = (
  type: CompareFilterType,
  date: Date,
): string => {
  if (type === "daily")
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (type === "monthly")
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return date.toLocaleDateString("id-ID", { year: "numeric" });
};

export const formatStaffPeriodLabel = (
  type: FilterType,
  date: Date,
): string => {
  if (type === "daily")
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (type === "weekly") {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(d.setDate(monday.getDate() + 6));
    return `${monday.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} – ${sunday.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};
