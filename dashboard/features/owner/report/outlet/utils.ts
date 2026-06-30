import { CompareFilterType, FilterType } from "./types";

export const formatPeriodLabel = (type: FilterType, date: Date): string => {
  if (type === "daily")
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (type === "weekly") {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} – ${sunday.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "monthly")
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return date.toLocaleDateString("id-ID", { year: "numeric" });
};

export const formatComparePeriodLabel = (
  type: CompareFilterType,
  date: Date,
): string => {
  if (type === "daily")
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
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
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (type === "weekly") {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} – ${sunday.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "monthly")
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return date.toLocaleDateString("id-ID", { year: "numeric" });
};
