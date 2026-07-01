import { format, addMinutes } from "date-fns";
import { id } from "date-fns/locale";

const WIB_TIMEZONE = "Asia/Jakarta";

export const DateUtil = {
  now(): string {
    return new Date().toISOString();
  },

  formatDate(date: Date, fmt: string = "d MMMM yyyy"): string {
    return format(date, fmt);
  },

  addMinutes(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  },
};

export const WIBUtil = {
  /**
   * Convert Date to YYYY-MM-DD string in WIB timezone
   */
  toDateString(date: Date): string {
    return date.toLocaleDateString("sv-SE", { timeZone: WIB_TIMEZONE });
  },

  /**
   * Get current date string in WIB timezone (YYYY-MM-DD)
   */
  todayString(): string {
    return this.toDateString(new Date());
  },

  /**
   * Format date in WIB with date-fns locale
   */
  formatDate(date: Date, fmt: string = "dd MMMM yyyy"): string {
    return format(date, fmt, { locale: id });
  },

  /**
   * Get start of day in WIB
   */
  startOfDayWIB(date: Date = new Date()): Date {
    const wibStr = this.toDateString(date);
    return new Date(`${wibStr}T00:00:00+07:00`);
  },

  /**
   * Get end of day in WIB
   */
  endOfDayWIB(date: Date = new Date()): Date {
    const wibStr = this.toDateString(date);
    return new Date(`${wibStr}T23:59:59.999+07:00`);
  },

  /**
   * Convert a date-fns end-of-period result (e.g. endOfWeek, endOfMonth, endOfYear)
   * to the correct WIB end of day.
   *
   * date-fns end* functions return 23:59:59.999 in the server timezone (UTC).
   * In WIB (+7h), this time may already be the next day, causing toDateString()
   * to return the wrong date. This method normalizes by first getting the UTC
   * start of day, then converting that to WIB.
   */
  periodEndWIB(datefnsEnd: Date): Date {
    const utcDayStart = new Date(datefnsEnd);
    utcDayStart.setUTCHours(0, 0, 0, 0);
    const wibStr = this.toDateString(utcDayStart);
    return new Date(`${wibStr}T23:59:59.999+07:00`);
  },

  /**
   * Generate an array of WIB date strings (YYYY-MM-DD) between start and end,
   * inclusive. Unlike eachDayOfInterval, this operates purely in WIB calendar space
   * and is not affected by timezone shifts.
   */
  eachDayOfIntervalWIB(startWib: Date, endWib: Date): string[] {
    const startStr = this.toDateString(startWib);
    const endStr = this.toDateString(endWib);
    const [sY, sM, sD] = startStr.split("-").map(Number);
    const [eY, eM, eD] = endStr.split("-").map(Number);
    const current = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    const days: string[] = [];
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      days.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    return days;
  },
};

type TimeSlot = {
  start: Date;
  end: Date;
};

export function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
  date: string, // format: YYYY-MM-DD
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  let current = new Date(
    `${date}T${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}:00`,
  );
  const endTime = new Date(
    `${date}T${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}:00`,
  );

  while (current < endTime) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + intervalMinutes);

    if (slotEnd > endTime) break;

    slots.push({
      start: slotStart,
      end: slotEnd,
    });

    current = slotEnd;
  }

  return slots;
}

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);

  return {
    date: d.toLocaleDateString("sv-SE"),
    time: d.toLocaleTimeString("id-ID", { hour12: false }),
  };
};
