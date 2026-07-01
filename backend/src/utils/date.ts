import { format, addMinutes } from 'date-fns';
import { id } from 'date-fns/locale';

const WIB_TIMEZONE = 'Asia/Jakarta';

export const DateUtil = {
    now(): string {
        return new Date().toISOString();
    },

    formatDate(date: Date, fmt: string = 'd MMMM yyyy'): string {
        return format(date, fmt);
    },

    addMinutes(date: Date, minutes: number): Date {
        return addMinutes(date, minutes);
    }
};

export const WIBUtil = {
    /**
     * Convert Date to YYYY-MM-DD string in WIB timezone
     */
    toDateString(date: Date): string {
        return date.toLocaleDateString('sv-SE', { timeZone: WIB_TIMEZONE });
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
    formatDate(date: Date, fmt: string = 'dd MMMM yyyy'): string {
        return format(date, fmt, { locale: id, timeZone: WIB_TIMEZONE });
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
    }
};

type TimeSlot = {
    start: Date;
    end: Date;
};

export function generateTimeSlots(
    start: string,
    end: string,
    intervalMinutes: number,
    date: string // format: YYYY-MM-DD
): TimeSlot[] {
    const slots: TimeSlot[] = [];

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    let current = new Date(`${date}T${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}:00`);
    const endTime = new Date(`${date}T${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}:00`);

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
        date: d.toLocaleDateString('sv-SE'),
        time: d.toLocaleTimeString('id-ID', { hour12: false }),
    };
};
